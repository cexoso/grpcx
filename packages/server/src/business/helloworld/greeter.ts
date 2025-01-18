import { Controller, GrpcMethod } from "@protobuf-es/grpc-frame-work";
import { GreeterInterface } from "./greeter-interface";
import { HelloReply, HelloRequest } from "../../messages/helloworld";

@Controller("helloworld.Greeter")
export class Greeter implements GreeterInterface {
  @GrpcMethod("SayHello")
  public hello(input: HelloRequest): HelloReply {
    return {
      message: `hello ${input.name}`,
    };
  }
}
