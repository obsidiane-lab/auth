# syntax=docker/dockerfile:1

FROM webfront AS webfront
FROM core AS app

COPY --from=webfront /app/browser /app/public/app
COPY infra/caddy/Caddyfile.prod /etc/frankenphp/Caddyfile
