FROM node:current-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN apk add --no-cache --virtual .gyp python make g++ \
    && npm install \
    && apk del .gyp

COPY . .

CMD [ "node", "main.js" ]