import { Container, interfaces } from "inversify";
import { getClassDescription, Method } from "../../decorators";
import { applyMiddleware, Middleware, Next } from "../middleware";
import { dash } from "radash";
import { Modules } from "./modules";
import { runAllMehtodMiddlewares } from "../../decorators/apply-method-middleware-decorator";

export interface Options {
  // injectable classes
  injectables?: Function[];
  middlewares?: Middleware[];
  importModules?: Modules[];
}

export interface CreateAppOptions {
  importModules?: Modules[];
}

export interface RouteConfig {
  path: string[];
  compiledPathMatcher: Array<{
    match: (input: string) => boolean;
    originPath: string;
  }>;
  controllerName: string;
  controller: Function;
  methodName: string;
  httpMethod: Method;
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
  requestBuiltinModules: Function[];
  requestInjectables: Function[];
}) {
  function createRequestContainer(createRequestOptions?: CreateRequestOptions) {
    const requestContainer = opts.appContainer.createChild();

    // 业务自己的请求级 injectable 在这注入
    loadInjectables(requestContainer, opts.requestInjectables);
    // runtime 覆盖的
    loadInjectables(requestContainer, opts.requestBuiltinModules);
    // 团队抽象的
    loadInjectables(requestContainer, opts.requestModules);

    // 用于在构建请求实例时，绑定请求上下文，web login 等请求级功能函数可能是在此处绑定提供的
    bindConstantValues(
      requestContainer,
      createRequestOptions?.override?.constantsValues ?? [],
    );
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

export const grpcApp = (opts: Options) => {
  const middlewares = opts.middlewares ?? [];

  const controllerMaps = getControllerMaps(opts);
  const devImportModules = getModules(opts.importModules);

  const { appInjectables, requestInjectables } = getInjectables(
    opts.injectables,
  );
  // 应用级的服务在这注册
  return {
    createApp(opts?: CreateAppOptions) {
      const runtimeImportModules = getModules(opts?.importModules);

      const appContainer = new Container();

      // 业务自己声明的 injectables
      loadInjectables(appContainer, appInjectables);

      // 加载内置的模块，内置的模块意味着这是 runtime 传递过来的，它可能用于处理用户登录
      // rbac 权限等
      loadInjectables(appContainer, runtimeImportModules.appInjectables);

      // 加载研发声明依赖的模块, 这个模块的作用是为了给团队骨干抽象一些业务内复用的能力
      loadInjectables(appContainer, devImportModules.appInjectables);

      bindConstantValues(appContainer, devImportModules.constantsValues);
      bindConstantValues(appContainer, runtimeImportModules.constantsValues);

      return {
        // 返回给上层去继承，而不是将运行时传递进来
        // appContainer.parent = runtimeContainer;
        appContainer,
        createRequestContainer: requestContainerFactory({
          appContainer,
          requestBuiltinModules: runtimeImportModules.requestInjectables,
          requestInjectables: requestInjectables,
          requestModules: devImportModules.requestInjectables,
        }),
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
        getHandlerClass(namespace: string) {
          const handler = controllerMaps.get(namespace);
          return handler;
        },
      };
    },
  };
};
