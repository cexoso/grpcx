import { Service, CustomerError } from '@protobuf-es/grpc-frame-work'
import { HelloRequest, HelloReply, GetCurrentUserReq, User } from '../../messages/helloworld'

@Service('Request')
export class GreeterService {
  public sayHello(input: HelloRequest): HelloReply {
    const length = input.name?.length ?? 0
    if (length > 10) {
      throw new CustomerError('name length must be less than 11', -1)
    }
    return {
      message: `hello ${input.name}`,
    }
  }
  public getCurrentUser(_input: GetCurrentUserReq): User {
    throw new Error('TO IMPLEMENTS')
  }
}
