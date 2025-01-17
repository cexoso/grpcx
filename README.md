# 简介

这是继 [client-protobuf-cli](https://github.com/cexoso/client-protobuf-cli) 的尝试，在 client-protobuf-cli 中，我希望为浏览器也实现一个 rpc 调用的能力，所以我从底层实现了 pb 的编解码，以及 pb 到代码的生成器。

在做完这些后，我想为什么我不继续实现 grpc 呢？现有的 grpc 在支持双协议的时候需要依赖一个 grpc-gateway，我希望直接从底层开始开发一个天然支持双协议的 node grpc 框架，这就是这个仓库的由来。

# 安装

`pnpm i`

# demo

在 `packages/server` 下运行 npm run dev, 再在 `packages/client` 下运行 npm run dev，你可以看到一次 grpc 调用。

# 预期

添加生成器逻辑，让生成器将 pb 的编解码，类型生成好，研发只需要写业务逻辑。

随便支持双协议，以及浏览器端直接发起 grpc 调用的逻辑。
