FROM denoland/deno:latest

WORKDIR /ic-mappo

COPY ./src ./src
COPY ./deno* .

RUN mkdir storage