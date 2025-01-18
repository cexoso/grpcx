import { grpcApp } from "@protobuf-es/grpc-frame-work";
import { Hello } from "./controller/hello";
import { metadataManager } from "./messages/index";

export const HelloApp = grpcApp({
  injectables: [Hello],
  metadataManager,
});
