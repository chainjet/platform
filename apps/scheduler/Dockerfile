FROM node:18

COPY ../.. /app
WORKDIR /app

RUN yarn
RUN yarn build scheduler

CMD [ "node", "dist/apps/scheduler/main" ]

EXPOSE 8000
