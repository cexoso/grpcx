import { Controller, GrpcMethod } from "@protobuf-es/grpc-frame-work";

@Controller("helloworld.Greeter")
export class Hello {
  @GrpcMethod("SayHello")
  public hello(input: any) {
    console.log("debugger 🐛 ", input);
    return {
      message: `hello world`,
    };
  }
}
