import { createServer, constants } from "http2";
import { getMetadata } from "./messages";
import { Buffer } from "buffer";
import { HelloApp } from "./app";
import { decode, encode } from "@protobuf-es/grpc-utils";
const app = HelloApp.createApp();

constants.HTTP2_HEADER_STATUS;

const server = createServer();

server.on("stream", (stream, headers) => {
  const path = headers[":path"]!;
  const paths = path.split("/");
  const serviceName = paths[1]!;
  const methodName = paths[2]!;

  const handle = app.getHandlerClass(serviceName, methodName);
  const metadata = getMetadata(serviceName, methodName)!;
  const { responseEncoder, requestDecoder } = metadata;

  let data: Buffer[] = [];
  stream.on("data", (buffer: Buffer) => {
    data.push(buffer);
  });

  stream.on("end", () => {
    const req = Buffer.concat(data);
    const message = decode(new Uint8Array(req));
    const reqData = requestDecoder(message);
    const response = handle.apply(reqData);
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
const port = 50051;

console.log(`listen on ${port}`);
server.listen(port);
