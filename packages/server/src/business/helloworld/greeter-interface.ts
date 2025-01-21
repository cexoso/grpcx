import { HelloReply, HelloRequest } from "../../messages/helloworld";
export interface GreeterInterface {
  sayHello: (input: HelloRequest) => HelloReply;
}
