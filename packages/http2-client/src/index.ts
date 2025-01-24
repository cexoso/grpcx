import { ClientHttp2Session, connect } from 'http2'
import { getResponse } from './get-response'

export async function callRPC<I = any, O = any>(opts: {
  client: ClientHttp2Session
  path: string
  isJSON?: boolean
  encodeReq: (value: I) => Uint8Array
  decodeRes: (input: Uint8Array) => O
  data: I
}) {
  const { client, isJSON, path, data } = opts

  const req = client.request({
    ':path': path,
    // 这个表示希望接收的数据是原始数据，不要经过 gzip 压缩
    'accept-encoding': 'identity',
    'content-type': isJSON ? 'application/grpc' : 'application/json',
  })
  req.write(isJSON ? JSON.stringify({ data }) : opts.encodeReq(data))
  req.end()

  const response = await getResponse(req)

  const responseData: O = isJSON ? JSON.parse(response.data.toString()) : opts.decodeRes(response.data)

  return {
    // 回包数据
    data: responseData,
    trailer: response.trailers,
    headers: response.headers,
  }
}

export const createClient = (opts: { host: string; port: string; rejectUnauthorized?: boolean }) =>
  connect(`https://${opts.host}:${opts.port}`, {
    rejectUnauthorized: opts.rejectUnauthorized ?? true,
  })
