// 命令行生成的文件，不要直接修改该文件
import { createModule } from "@protobuf-es/grpc-frame-work";
import { Greeter as helloworldGreeter } from "./helloworld/greeter";

export const microservicesModule = createModule(() => {
  return {
    injectables: [helloworldGreeter],
  };
});
