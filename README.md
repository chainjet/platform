<p align="center">
  <a href="https://chainjet.io" target="blank"><img src="https://chainjet.io/logo.svg" width="320" alt="ChainJet Logo" /></a>
</p>
  
<p align="center">A workflow automation platform specialized on blockchain, with more than 300 integrations.</p>
<p align="center">
  <a href="https://twitter.com/chainjetio"><img src="https://img.shields.io/twitter/follow/chainjetio.svg?style=social&label=Follow"></a>
  <a href="https://discord.gg/QFnSwqj9YH" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
</p>

## Description

[ChainJet](https://chainjet.io) is a workflow automation platform specialized in blockchain and cloud infrastructure.

## Demo

[:tv: A short video (~3 mins)](https://www.youtube.com/watch?v=zCaqp2JnFA0) showing how to use ChainJet.

## Cloud solution

:cloud: We offer ChainJet as a managed cloud service, and we have a **free plan**. Get started [here](https://chainjet.io).

## Self-hosted solution

### Prerequisites:

- [Node.js](https://nodejs.org)
- [MongoDB](https://www.mongodb.com)

### Install instructions

* Clone this repository and the frontend into a new directory.

```bash
$ git clone git@github.com:chainjet/platform.git
$ git clone git@github.com:chainjet/frontend.git
```

* Copy the `.env.example` file to `.env` and edit it to your needs.

* Install platform dependencies:

```bash
$ cd platform
$ yarn
```

* Bootstrap all the integrations (this may take a while):

```bash
$ yarn start bootstrap
```

* On two different terminals, start the platform and the api and scheduler services.

```bash
$ yarn start:dev api
```

```bash
$ yarn start:dev scheduler
```

* On a new terminal, go to the frontend directory, install the dependencies and start it:

```bash
$ yarn
$ yarn dev
```

## Stay in touch

- Website - [https://chainjet.io](https://chainjet.io)
- Twitter - [@chainjetio](https://twitter.com/chainjetio)
- Discord - [ChainJet Community](https://discord.gg/QFnSwqj9YH)
