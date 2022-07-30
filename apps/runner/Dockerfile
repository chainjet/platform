FROM node:14

# context path: ./backend
COPY . /app/chainjet/backend
WORKDIR /app/chainjet/backend

RUN yarn
RUN yarn build runner

CMD ["yarn", "start:prod:runner"]
