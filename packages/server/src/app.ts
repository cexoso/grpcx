import { grpcApp } from "@cexoso/grpc-frame-work";
import { Hello } from "./controller/hello";

export const HelloApp = grpcApp({
  injectables: [Hello],
});
