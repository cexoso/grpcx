import { ClientHttp2Stream, connect } from "http2";
import { encodeHelloRequest, decodeHelloReply } from "./messages/helloworld";
import { wrapEncode, wrapDecode } from "@protobuf-es/core";
import { Buffer } from "buffer";
import { encode, decode } from "@protobuf-es/grpc-utils";

function getData(req: ClientHttp2Stream) {
  let data: Buffer[] = [];
  return new Promise<Buffer>((resolve, reject) => {
    req.on("data", (chunk) => data.push(chunk));
    req.on("end", () => resolve(Buffer.concat(data)));
    req.on("error", (error) => reject(error));
  });
}
function getReqHeader(contentType: string) {
  return {
    ":authority": "localhost:50051",
    ":method": "POST",
    ":path": "/helloworld.Greeter/SayHello",
    ":scheme": "http",
    "accept-encoding": "identity",
    "content-type": contentType,
    te: "trailers",
  };
}

async function callWithJSON() {
  const client = connect("http://localhost:50051");

  const req = client.request(getReqHeader("application/json"));

  req.write(JSON.stringify({ name: "world" }));
  req.end();

  req.on("trailers", (headers) => {
    console.log("json call trailers", headers);
  });
  req.on("response", (header) => {
    console.log("json call header", header);
  });
  const data = await getData(req);
  console.log("json get data:", data);

  const x = data.toString();
  console.log(JSON.parse(x));

  client.close();
}

async function callWithRPC() {
  const client = connect("http://localhost:50051");

  const req = client.request(getReqHeader("application/grpc"));

  const encodeMessage = wrapEncode(encodeHelloRequest);
  const decodeMessage = wrapDecode(decodeHelloReply);
  const message = encodeMessage({
    name: "world",
  });

  const x = encode(new Uint8Array(Buffer.from(message)));
  req.write(x);
  req.end();

  req.on("trailers", (headers) => {
    console.log("rpc call trailers", headers);
  });
  req.on("response", (header) => {
    console.log("rpc call header", header);
  });

  const data = await getData(req);
  console.log("rpc get data:", data);

  console.log(decodeMessage(decode(new Uint8Array(data))));
  client.close();
}

async function main() {
  await callWithJSON();

  await callWithRPC();
}

main();
