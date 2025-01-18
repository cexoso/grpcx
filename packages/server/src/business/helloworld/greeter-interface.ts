import { HelloReply, HelloRequest } from "../../messages/helloworld";
export interface GreeterInterface {
  hello: (input: HelloRequest) => HelloReply;
}
