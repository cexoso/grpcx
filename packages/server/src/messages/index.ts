import { MetaDataManager } from "@protobuf-es/grpc-frame-work";
import { decodeHelloReply, encodeHelloReply } from "./helloworld";
import { wrapDecode, wrapEncode } from "@protobuf-es/core";

export const metaDataManager = new MetaDataManager();

metaDataManager.setMetaData("helloworld.Greeter", "SayHello", {
  requestDecoder: wrapDecode(decodeHelloReply),
  responseEncoder: wrapEncode(encodeHelloReply),
});

export const getMetadata: MetaDataManager["getMetadata"] =
  metaDataManager.getMetadata.bind(metaDataManager);
