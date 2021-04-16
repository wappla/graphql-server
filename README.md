# Dashdot Graphql Server

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