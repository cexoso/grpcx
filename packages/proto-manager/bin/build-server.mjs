import { getCmd } from "@protobuf-es/cli";
import { join, dirname } from "path";

const __dirname = dirname(new URL(import.meta.url).pathname);

const cmd = getCmd();

cmd.compileProtos({
  protoDir: join(__dirname, "../protos"),

  // 将中间文件生成到临时文件目录
  outDir: join(__dirname, "../../server"),

  // 最终会 prettier 格式化，所以中间产物不需要 prettier
  withPrettier: false,
});
