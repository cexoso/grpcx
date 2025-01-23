import { Service } from '@protobuf-es/grpc-frame-work'
import { HelloRequest, HelloReply, GetCurrentUserReq, User } from '../../messages/helloworld'

@Service('Request')
export class GreeterService {
  public async sayHello(_input: HelloRequest): Promise<HelloReply> {
    const response = await fetch('https://127.0.0.1:50051/helloworld.Greeter/SayHello', {
      method: 'POST',
      headers: {
        ':authority': 'localhost:50051',
        ':path': '/helloworld.Greeter/SayHello',
        'accept-encoding': 'identity',
        'content-type': 'application/grpc',
        te: 'trailers',
      },
    })
    const data = await response.json()
    return data
  }
  public async getCurrentUser(_input: GetCurrentUserReq): Promise<User> {
    console.log('debugger 🐛 _input', _input)
    const response = await fetch('https://127.0.0.1:50051/helloworld.Greeter/GetCurrentUser', {
      method: 'POST',
      headers: {
        ':authority': 'localhost:50051',
        ':path': '/helloworld.Greeter/GetCurrentUser',
        'accept-encoding': 'identity',
        'content-type': 'application/grpc',
        te: 'trailers',
      },
    })
    const data = await response.json()
    return data
  }
}
