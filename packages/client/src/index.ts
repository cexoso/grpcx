import { ClientHttp2Stream, connect } from 'http2'
import { encodeHelloRequest, decodeHelloReply } from './messages/helloworld'
import { wrapEncode, wrapDecode } from '@protobuf-es/core'
import { Buffer } from 'buffer'
import { encode, decode } from '@protobuf-es/grpc-utils'

function getData(req: ClientHttp2Stream) {
  let data: Buffer[] = []
  return new Promise<Buffer>((resolve, reject) => {
    req.on('data', (chunk) => data.push(chunk))
    req.on('end', () => resolve(Buffer.concat(data)))
    req.on('error', (error) => reject(error))
  })
}
function getTrailer(req: ClientHttp2Stream) {
  return new Promise<any>((resolve) => {
    req.on('trailers', (headers) => resolve(headers))
  })
}

const getResponse = async (req: ClientHttp2Stream) => {
  const data$ = getData(req)
  const trailer$ = getTrailer(req)
  const trailer = await trailer$
  return {
    data: await data$,
    trailer: {
      // http header 需要传输 http 友好的格式，所有需要解码
      'grpc-message': decodeURIComponent(trailer['grpc-message']),
      'grpc-status': trailer['grpc-status'],
    },
  }
}
function getReqHeader(contentType: string) {
  return {
    ':authority': 'localhost:50051',
    ':method': 'POST',
    ':path': '/helloworld.Greeter/SayHello',
    ':scheme': 'http',
    'accept-encoding': 'identity',
    'content-type': contentType,
    te: 'trailers',
  }
}

async function callWithJSON(name: string) {
  const client = connect('http://localhost:50051')

  const req = client.request(getReqHeader('application/json'))

  req.write(JSON.stringify({ name }))
  req.end()

  const { trailer, data } = await getResponse(req)
  console.log('rpc call trailers', trailer)
  console.log('rpc get data:', data)
  if (trailer['grpc-status'] !== 0) {
    client.close()
    return
  }
  req.on('response', (header) => {
    console.log('json call header', header)
  })
  console.log('json get data:', data)

  const x = data.toString()
  console.log(JSON.parse(x))

  client.close()
}

async function callWithRPC(name: string) {
  const client = connect('http://localhost:50051')

  const req = client.request(getReqHeader('application/grpc'))

  const encodeMessage = wrapEncode(encodeHelloRequest)
  const decodeMessage = wrapDecode(decodeHelloReply)
  const message = encodeMessage({
    name,
  })

  const x = encode(new Uint8Array(Buffer.from(message)))
  req.write(x)
  req.end()

  const { data, trailer } = await getResponse(req)
  console.log('rpc call trailers', trailer)
  console.log('rpc get data:', data)
  if (trailer['grpc-status'] !== '0') {
    client.close()
    return
  }

  req.on('response', (header) => {
    console.log('rpc call header', header)
  })

  console.log(decodeMessage(decode(new Uint8Array(data))))
  client.close()
}

async function main() {
  callWithJSON('world')
  callWithRPC('world')
  callWithRPC('传一个超长的名称以触发服务器端抛业务异常')
}

main()
