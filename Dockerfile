FROM node:18-slim

RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot

RUN set -ex; \
    apt-get update; \
    apt-get -yq upgrade; \
    apt-get -y install make libtool autoconf automake python3 g++

COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

CMD ["node", "index.mjs"]