FROM node:18

COPY ../.. /app
WORKDIR /app

RUN yarn
RUN yarn build blockchain-listener

CMD [ "node", "dist/apps/blockchain-listener/main" ]

EXPOSE 8000
