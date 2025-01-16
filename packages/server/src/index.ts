import { createServer } from "http2";
import { getBodyFromReq } from "./utils/get-body-from-req";
import { wrapDecode, wrapEncode } from "@protobuf-es/core";
import {
  decodeHelloRequest as _decodeHelloRequests,
  encodeHelloReply as _encodeHelloReply,
} from "./messages/helloworld";
import { decode, encode } from "./coding";
import { Buffer } from "buffer";

const decodeHelloRequest = wrapDecode(_decodeHelloRequests);
const encodeHelloReply = wrapEncode(_encodeHelloReply);

const server = createServer(async (req, res) => {
  const body = await getBodyFromReq(req);
  const message = decode(body);
  const data = decodeHelloRequest(message);
  const responsMessage = encodeHelloReply({
    message: `hello ${data.name}`,
  });

  res.end(encode(Buffer.from(responsMessage)));
});
const port = 50051;

console.log(`listen on ${port}`);
server.listen(port);
