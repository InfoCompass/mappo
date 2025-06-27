FROM denoland/deno:2.3.6

WORKDIR /ic-mappo

COPY . .

CMD ["deno", "run", "--allow-read","--allow-write", "--allow-net", "--unstable-kv", "--unstable-cron", "main.ts"]