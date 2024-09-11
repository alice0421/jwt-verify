FROM node:20.17.0-bullseye-slim

RUN apt update -y && \
    apt upgrade -y

# NOTE: gitはコンテナ外（ローカル）でやる
# aws-cliインストール用に、curl unzip sudoをインストール
# aws-cliの出力表示時にlessというページャーがデフォルト利用される
RUN apt install -y vim curl unzip sudo less

# install aws-cli v2
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    sudo ./aws/install

WORKDIR /app
