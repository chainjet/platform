FROM node:14

# context path: ./backend
COPY . /app/chainjet/backend
WORKDIR /app/chainjet/backend

RUN yarn
RUN yarn build scheduler

CMD ["yarn", "start:prod:scheduler"]
