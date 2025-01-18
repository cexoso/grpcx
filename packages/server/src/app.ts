import { grpcApp } from "@protobuf-es/grpc-frame-work";
import { Hello } from "./controller/hello";

export const HelloApp = grpcApp({
  injectables: [Hello],
});
