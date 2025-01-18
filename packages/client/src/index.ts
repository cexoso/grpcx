import { connect } from "http2";
import { encodeHelloRequest } from "./messages/helloworld";
import { wrapEncode } from "@protobuf-es/core";
import { Buffer } from "buffer";
import { encode } from "@protobuf-es/grpc-utils";

const client = connect("http://localhost:50051");

const req = client.request({
  ":authority": "localhost:50051",
  ":method": "POST",
  ":path": "/helloworld.Greeter/SayHello",
  ":scheme": "http",
  "grpc-accept-encoding": "identity,deflate,gzip",
  "accept-encoding": "identity",
  "user-agent": "grpc-node-js/1.12.5",
  "content-type": "application/grpc",
  te: "trailers",
});

const encodeMessage = wrapEncode(encodeHelloRequest);
const message = encodeMessage({
  name: "world",
});

const x = encode(new Uint8Array(Buffer.from(message)));
console.log("debugger 🐛", x.buffer);

req.write(x);
req.end();

let data = Buffer.from("");

req.on("data", (chunk) => {
  data = Buffer.concat([data, chunk]);
});

req.on("end", () => {
  console.log(data.toString());
  client.close();
});

req.on("trailers", (headers) => {
  console.log("debugger 🐛 headers", headers);
});
