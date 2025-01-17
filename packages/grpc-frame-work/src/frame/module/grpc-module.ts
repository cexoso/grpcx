import { Container, interfaces } from "inversify";
import { getClassDescription } from "../../decorators";
import { applyMiddleware, Middleware, Next } from "../middleware";
import { dash } from "radash";
import { Modules } from "./modules";
import { runAllMehtodMiddlewares } from "../../decorators/apply-method-middleware-decorator";
import { getGrpcDescriptions } from "../../decorators/grpc-decorator";

export interface Options {
  // injectable classes
  injectables?: Function[];
  middlewares?: Middleware[];
  importModules?: Modules[];
}

export interface RouteConfig {
  controllerName: string;
  controller: Function;
  methodName: string;
  rpcMethod: string;
}

// 从模块中获取到应用级模块和请求级模块
function getModules(modules?: Modules[]) {
  const constantsValues =
    modules?.flatMap((module) => module.constantsValues ?? []) ?? [];
  const injectables =
    modules?.flatMap((modules) => modules.injectables ?? []) ?? [];
  const { appInjectables, requestInjectables } = getInjectables(injectables);
  return {
    appInjectables,
    requestInjectables,
    constantsValues,
  };
}

function getControllerMaps(opts: Options) {
  const injectables = opts.injectables;
  const controllerMaps = new Map(
    injectables
      ?.filter((injectable) => {
        const description = getClassDescription(injectable);
        return description.type === "Controller";
      })
      // 这个要求不能压缩，否则名称会被更改
      // 这里要支持 controller 传名字参数，防止压缩命名
      .map((injectable) => [dash(injectable.name), injectable]),
  );
  return controllerMaps;
}

// 根据传递进来的 injectables 分出应用级可注入对象和请求级可注入对象
function getInjectables(injectables?: Function[]) {
  const appInjectables =
    injectables?.filter((injectable) => {
      const description = getClassDescription(injectable);
      return description.type === "Service" && description.scope === "App";
    }) ?? [];

  const requestInjectables =
    injectables?.filter((injectable) => {
      const description = getClassDescription(injectable);
      if (description.type === "Controller") {
        return true;
      }
      if (description.type === "Service" && description.scope === "Request") {
        return true;
      }
      return false;
    }) ?? [];
  return { appInjectables, requestInjectables };
}

function loadInjectables(container: Container, injectables: Function[]) {
  injectables.forEach((injectable) => {
    const hasBinding = container.isCurrentBound(injectable);
    if (hasBinding) {
      const name = injectable.name ? injectable.name : String(injectable.name);
      console.log(`warning: ${name} already bound`);
    }
    const binding = hasBinding
      ? container.rebind(injectable)
      : container.bind(injectable);

    binding.toSelf().inSingletonScope();
  });
}

export interface ConstantsValues {
  identifier: interfaces.ServiceIdentifier;
  value: any;
}

export interface CreateRequestOptions {
  override?: {
    constantsValues?: ConstantsValues[];
  };
}
function requestContainerFactory(opts: {
  appContainer: Container;
  requestModules: Function[];
  requestInjectables: Function[];
}) {
  function createRequestContainer() {
    const requestContainer = opts.appContainer.createChild();

    // 业务自己的请求级 injectable 在这注入
    loadInjectables(requestContainer, opts.requestInjectables);
    // 团队抽象的
    loadInjectables(requestContainer, opts.requestModules);

    return requestContainer;
  }
  return createRequestContainer;
}

function bindConstantValues(
  container: Container,
  constantsValues?: Modules["constantsValues"],
) {
  constantsValues?.forEach(({ identifier, value }) => {
    const hasBinding = container.isCurrentBound(identifier);
    if (hasBinding) {
      console.log(`warning: ${String(identifier)} already bound`);
    }

    const binding = hasBinding
      ? container.rebind(identifier)
      : container.bind(identifier);

    binding.toConstantValue(value);
  });
}

const createRouterHelper = (controllerMaps: Map<string, Function>) => {
  type ServiceName = string;
  type MethodName = string;
  const routeMap: Map<ServiceName, Map<MethodName, RouteConfig>> = new Map();
  for (const [controllerName, controller] of controllerMaps) {
    const routerDescription = getGrpcDescriptions(controller);
    const classDescriptions = getClassDescription(controller);
    if (classDescriptions.type !== "Controller") {
      continue;
    }
    if (routerDescription) {
      for (const [methodName, description] of Object.entries(
        routerDescription,
      )) {
        let methodMap = routeMap.get(classDescriptions.serviceName);
        if (methodMap === undefined) {
          methodMap = new Map();
          routeMap.set(classDescriptions.serviceName, methodMap);
        }
        for (const method of description.method) {
          methodMap.set(method, {
            rpcMethod: method,
            controllerName,
            controller,
            methodName,
          });
        }
      }
    }
  }
  return {
    getHandle(serviceName: ServiceName, path: string) {
      const serviceMap = routeMap.get(serviceName);
      const description = serviceMap?.get(path);
      return description;
    },
  };
};

export const grpcApp = (opts: Options) => {
  const middlewares = opts.middlewares ?? [];

  const controllerMaps = getControllerMaps(opts);
  const importModules = getModules(opts.importModules);

  const { appInjectables, requestInjectables } = getInjectables(
    opts.injectables,
  );

  const routerHelper = createRouterHelper(controllerMaps);
  // 应用级的服务在这注册
  return {
    createApp() {
      const appContainer = new Container();

      // 业务自己声明的 injectables
      loadInjectables(appContainer, appInjectables);

      // 加载内置的模块，内置的模块意味着这是 runtime 传递过来的，它可能用于处理用户登录
      // rbac 权限等

      // 加载研发声明依赖的模块, 这个模块的作用是为了给团队骨干抽象一些业务内复用的能力
      loadInjectables(appContainer, importModules.appInjectables);

      bindConstantValues(appContainer, importModules.constantsValues);

      const createRequestContainer = requestContainerFactory({
        appContainer,
        requestInjectables: requestInjectables,
        requestModules: importModules.requestInjectables,
      });
      return {
        // 返回给上层去继承，而不是将运行时传递进来
        // appContainer.parent = runtimeContainer;
        appContainer,
        createRequestContainer,
        unshiftMiddleware(middleware: Middleware) {
          middlewares.unshift(middleware);
        },
        async applyMethodMiddllware(
          opts: {
            requestContainer: Container;
            target: Function;
            propertyKey: string | symbol;
          },
          ctx: any,
          next: Next,
        ) {
          await runAllMehtodMiddlewares(opts, ctx, next);
        },
        async applyMidware(ctx: any, next: Next) {
          if (middlewares === undefined) {
            return next(); // 表示直接执行外部的逻辑
          }
          await applyMiddleware(middlewares, ctx, next);
        },
        getHandlerClass(serviceName: string, method: string) {
          const handle = routerHelper.getHandle(serviceName, method);
          return {
            apply: <T>(input: T) => {
              const { controller, methodName } = handle!;
              const requestContainer = createRequestContainer();
              const controllerInstance = requestContainer.get<any>(controller);
              return controllerInstance[methodName].apply(controllerInstance, [
                input,
              ]);
            },
            ...handle,
          };
        },
      };
    },
  };
};
