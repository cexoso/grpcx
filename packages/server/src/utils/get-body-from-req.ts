import { Http2ServerRequest } from "http2";
import { Buffer } from "buffer";

export function getBodyFromReq(req: Http2ServerRequest) {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on("end", () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer);
    });

    req.on("error", (err) => {
      reject(err);
    });
  });
}
