FROM node:18

COPY ../.. /app/chainjet/backend
WORKDIR /app/chainjet/backend

RUN yarn
RUN yarn build api

CMD [ "node", "dist/apps/api/main" ]

EXPOSE 8000
