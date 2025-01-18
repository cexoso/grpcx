import { grpcApp } from "@protobuf-es/grpc-frame-work";
import { Greeter as helloworldGreeter } from "./business/helloworld/greeter";
import { metadataManager } from "./messages/index";

export const HelloApp: ReturnType<typeof grpcApp> = grpcApp({
  injectables: [helloworldGreeter],
  metadataManager,
});
