# Dashdot Graphql Server

[![build](https://img.shields.io/github/workflow/status/wappla/graphql-server/Build?style=flat&colorA=000000&colorB=000000)](https://github.com/wappla/graphql-server/actions/workflows/on_push_main.yml)
[![codecov](https://img.shields.io/codecov/c/github/wappla/graphql-server?style=flat&colorA=000000&colorB=000000)](https://codecov.io/gh/wappla/graphql-server)

A high performance graphql handler using the power of JIT.

## Usage

Inside your Node project directory, run the following:

```sh
npm i --save @dashdot/graphql-server
```

Or with Yarn:

```sh
yarn add @dashdot/graphql-server
```

### API

```javascript
import { createServer } from 'http'
import {
    GraphqlQueryStore,
    createGraphqlRequestHandler
} from '@dashdot/graphql-server'
import schema from './schema'

const { PORT, HOST } = process.env

const store = new GraphqlQueryStore(schema)

const server = createServer(
    createGraphqlRequestHandler(store)
)

server.listen(PORT, HOST, () => {
    console.log(`Server started and listening on http://${HOST}:${PORT}`)
})
```