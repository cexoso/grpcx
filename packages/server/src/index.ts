import { createServer, constants } from "http2";
import { wrapDecode, wrapEncode } from "@protobuf-es/core";
import {
  decodeHelloRequest as _decodeHelloRequests,
  encodeHelloReply as _encodeHelloReply,
} from "./messages/helloworld";
import { encode, decode } from "@cexoso/grpc-utils";
import { Buffer } from "buffer";
constants.HTTP2_HEADER_STATUS;

const decodeHelloRequest = wrapDecode(_decodeHelloRequests);
const encodeHelloReply = wrapEncode(_encodeHelloReply);

const server = createServer();

server.on("stream", (stream, headers) => {
  console.log("debugger 🐛 headers", headers);
  let data: Buffer[] = [];
  stream.on("data", (buffer: Buffer) => {
    data.push(buffer);
  });

  stream.on("end", () => {
    const req = Buffer.concat(data);
    const message = decode(new Uint8Array(req));
    const reqData = decodeHelloRequest(message);
    const responsMessage = encodeHelloReply({
      message: `hello ${reqData.name}`,
    });

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
        console.log("res.stream.end();");
        if (!error) {
          stream.end();
          stream.once("wantTrailers", () => {
            console.log("debugger 🐛 sendTrailers");
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
