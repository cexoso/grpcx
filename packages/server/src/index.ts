import { createServer } from "http2";
import { getBodyFromReq } from "./utils/get-body-from-req";

const server = createServer(async (req, res) => {
  const body = await getBodyFromReq(req);
  console.log("debugger 🐛 body", body);
});
const port = 50051;

console.log(`listen on ${port}`);
server.listen(port);
