import { ServerHttp2Stream } from 'http2'

const getMessageAndCode = (error: unknown) => {
  if (error instanceof Error) {
    // @ts-ignore
    const code = error.code ?? -1
    return {
      message: error.message,
      code: code,
    }
  }
  return {
    code: -1,
    message: 'unknown',
  }
}

export function errorHandler(error: unknown, stream: ServerHttp2Stream) {
  const { message, code } = getMessageAndCode(error)
  stream.end()
  stream.once('wantTrailers', () => {
    stream.sendTrailers({
      'grpc-message': message,
      'grpc-status': code,
    })
  })
}
