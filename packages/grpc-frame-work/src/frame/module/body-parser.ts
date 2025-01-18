import { Buffer } from "buffer";
import { ServerHttp2Stream } from "http2";

export function getBody(stream: ServerHttp2Stream) {
  return new Promise<Buffer>((resolve, reject) => {
    let data: Buffer[] = [];
    stream.on("data", (buffer: Buffer) => {
      data.push(buffer);
    });
    stream.on("end", () => {
      resolve(Buffer.concat(data));
    });
    stream.on("error", (error) => {
      reject(error);
    });
  });
}
