import { ServerHttp2Stream } from "http2";

export function response200(stream: ServerHttp2Stream) {
  stream.respond(
    {
      ":status": 200,
      "content-type": "application/grpc+proto",
      "grpc-accept-encoding": "identity,deflate,gzip",
      "grpc-encoding": "identity",
    },
    { waitForTrailers: true },
  );
}

export function response404(stream: ServerHttp2Stream) {
  stream.respond({
    ":status": 404,
  });
}
