import { Http2Server } from "http2";
import { encode, decode } from "@protobuf-es/grpc-utils";
import { getBody } from "./body-parser";
import { response200, response404 } from "./response";
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
  server.on("stream", async (stream, headers) => {
    const path = headers[":path"]!;
    const paths = path.split("/");
    const serviceName = paths[1]!;
    const methodName = paths[2]!;

    const handleData = getApply(serviceName, methodName);
    if (handleData === undefined) {
      response404(stream);
      return;
    }
    const { responseEncoder, requestDecoder } = handleData;

    const req = await getBody(stream);
    const message = decode(new Uint8Array(req));
    const reqData = requestDecoder(message);
    const response = handleData.apply(reqData as any);
    const responsMessage = responseEncoder(response);
    response200(stream);
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
};
