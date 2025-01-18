import { Http2Server } from "http2";
import { encode, decode } from "@protobuf-es/grpc-utils";
type ServiceName = string;
type MethodName = string;

interface HandleRequestOpts {
  http2server: Http2Server;
  getApply: <T = unknown>(
    serviceName: ServiceName,
    methodName: MethodName,
  ) =>
    | {
        apply: (input: Uint8Array) => T;
        requestDecoder: (input: Uint8Array) => T;
        responseEncoder: (input: T) => Uint8Array;
      }
    | undefined;
}

export const handleRequest = (opts: HandleRequestOpts) => {
  const { http2server: server, getApply } = opts;
  server.on("stream", (stream, headers) => {
    const path = headers[":path"]!;
    const paths = path.split("/");
    const serviceName = paths[1]!;
    const methodName = paths[2]!;

    const handleData = getApply(serviceName, methodName);
    if (handleData === undefined) {
      return;
      // 处理 404
    }
    const { responseEncoder, requestDecoder } = handleData;

    let data: Buffer[] = [];
    stream.on("data", (buffer: Buffer) => {
      data.push(buffer);
    });

    stream.on("end", () => {
      const req = Buffer.concat(data);
      const message = decode(new Uint8Array(req));
      const reqData = requestDecoder(message);
      const response = handleData.apply(reqData as any);
      const responsMessage = responseEncoder(response);
      stream.respond(
        {
          ":status": 200,
          "content-type": "application/grpc+proto",
          "grpc-accept-encoding": "identity,deflate,gzip",
          "grpc-encoding": "identity",
        },

        {
          waitForTrailers: true,
        },
      );
      stream.write(
        encode(new Uint8Array(Buffer.from(responsMessage))),
        (error) => {
          if (!error) {
            stream.end();
            stream.once("wantTrailers", () => {
              stream.sendTrailers({
                "grpc-message": "OK",
                "grpc-status": 0,
              });
            });
          }
        },
      );
    });
  });
};
