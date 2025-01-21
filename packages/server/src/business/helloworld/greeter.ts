import { Controller, GrpcMethod } from '@protobuf-es/grpc-frame-work'
import { GreeterInterface } from './greeter-interface'
import { HelloReply, HelloRequest } from '../../messages/helloworld'
import { CustomerError } from '../../../../grpc-frame-work/src/errors'

@Controller('helloworld.Greeter')
export class Greeter implements GreeterInterface {
  @GrpcMethod('SayHello')
  public sayHello(input: HelloRequest): HelloReply {
    const length = input.name?.length ?? 0
    if (length > 10) {
      throw new CustomerError('name length must be less than 11', -1)
    }
    return {
      message: `hello ${input.name}`,
    }
  }
}
