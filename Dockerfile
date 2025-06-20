FROM denoland/deno:2.3.6

WORKDIR /ic-mappo

COPY . .

RUN deno install

CMD deno run start