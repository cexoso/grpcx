import { MetaDataManager } from "@protobuf-es/grpc-frame-work";
import { decodeHelloRequest, encodeHelloReply } from "./helloworld";
import { wrapDecode, wrapEncode } from "@protobuf-es/core";

export const metadataManager = new MetaDataManager();

metadataManager.setMetaData("helloworld.Greeter", "SayHello", {
  requestDecoder: wrapDecode(decodeHelloRequest),
  responseEncoder: wrapEncode(encodeHelloReply),
});

export const getMetadata: MetaDataManager["getMetadata"] =
  metadataManager.getMetadata.bind(metadataManager);
