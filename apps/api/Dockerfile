FROM node:14

# context path: ./backend
COPY . /app/chainjet/backend
WORKDIR /app/chainjet/backend

RUN yarn
RUN yarn build

CMD [ "yarn", "start:prod:api" ]

EXPOSE 8000
