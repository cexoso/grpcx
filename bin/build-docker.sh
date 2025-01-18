#! /bin/bash

# 报错即停止
set -e

cd `dirname $0` # 确保 CWD 是当前目录
cd ..

docker buildx build --platform=linux/amd64 \
  --build-arg HTTP_PROXY= \
  --build-arg HTTPS_PROXY= \
  --build-arg http_proxy= \
  --build-arg https_proxy= \
  --tag release:1.0.0 .

