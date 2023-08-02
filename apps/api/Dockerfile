FROM node:18

COPY ../.. /app
WORKDIR /app

RUN yarn
RUN yarn build api

CMD [ "node", "dist/apps/api/main" ]

EXPOSE 8000
