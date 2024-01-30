# Dashdot Graphql Server

[![build](https://img.shields.io/github/workflow/status/wappla/graphql-server/Build?style=flat&colorA=000000&colorB=000000)](https://github.com/wappla/graphql-server/actions/workflows/on_push_main.yml)
[![codecov](https://img.shields.io/codecov/c/github/wappla/graphql-server?style=flat&colorA=000000&colorB=000000)](https://codecov.io/gh/wappla/graphql-server)

A simple high performance graphql handler using the power of JIT. 

## Usage

Inside your Node project directory, run the following:

```sh
npm i --save @dashdot/graphql-server
```

Or with Yarn:

```sh
yarn add @dashdot/graphql-server
```

### Example

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

# API

Dashdot Graphql Server is a simple graphql request processor designed to be framework agnostic. You can use it either with the default Node http server or implement it in your own framework. The library exposes 2 main  functions:
- [`processGraphqlRequest`](/src/processGraphqlRequest.ts)
- [`createGraphqlRequestHandler`](/src/createGraphqlRequestHandler.ts)

Where `createGraphqlRequestHandler` is just an implementation of `processGraphqlRequest` using the native Node http package.

What do these functions do? As little as possible. We designed this library to reduce the overhead provided by other libraries. The library processes and validates a Graphql request and passes it to your schema to be interpreted. In sequence here are the steps that are taken:

- Do we have a valid request (are we uploading something)?
- Validate (and compile) the query
- Create the request context
- Pass query and context to your schema
- Return the result

You schema is not passed directly to the request handler, instead we pass it to a `GraphqlQueryStore`. The query store wil use the power of JIT (just-in-time compilation) to improve the query performance. You can read more about this [here](https://github.com/zalando-incubator/graphql-jit).

#### processGraphqlRequest

```typescript
export default function processGraphqlRequest(
    req: IncomingMessage,
    options: ProcessGraphqlRequestOptions
): Promise<GraphqlResponse>;
```

#### ProcessGraphqlRequestOptions

```typescript
type ProcessGraphqlRequestOptions = {
    store: GraphqlQueryStore
    context: any
    processFileUploads?: (req: IncomingMessage) => Promise<any>
    readRequestBody: (req: IncomingMessage) => Promise<any>
}
```

#### GraphqlResponse

```typescript
type GraphqlResponse = {
    status: number
    text?: string
    body?: any
}
```

## Security

While we try to minimize the overhead of this library it offers basic protection against query complexity attacks using the [`graphql-query-complexity`](https://github.com/slicknode/graphql-query-complexity) package. You can customize this basic config by setting the `defaultComplexity` and `maximumComplexity` complexity options for the GraphqlQueryStore. You can also extend the validation rules by providing your own custom rules as `validationRules` option.

```typescript
type QueryComplexityOptions = {
    maximumComplexity?: number
    defaultComplexity?: number
}

type GraphqlQueryStoreOptions = {
    validationRules?: [ValidationRule]
    queryComplexity?: QueryComplexityOptions
} 

class GraphqlQueryStore {
    constructor(
        schema: GraphQLSchema,
        options?: GraphqlQueryStoreOptions
    ) {}
}
```

##  How do I implement this in framework X

By using the `processGraphqlRequest` function. This function takes a request (like) object and some options to process the graphql request Below you can find an example of an implementation in Next.js and Express.

**Example Next.js**

```javascript
// /api/graphql/route.js

import type { NextRequest } from 'next/server'
import { GraphqlQueryStore, processGraphqlRequest } from '@dashdot/graphql-server'
import { createSchema } from './createSchema'
import { createRequestContext } from './requestContext'

const schema = createSchema()
const store = new GraphqlQueryStore(schema)

export async function POST(req: NextRequest) {
    try {
        const { status, text, body } = await processGraphqlRequest(req, {
            store,
            context: createRequestContext(req),
            readRequestBody: () => req.json(),
        })
        if (text) {
            return new Response(text, { status })
        }
        if (body) {
            return Response.json(body, { status })
        }
    } catch (e) {
        return new Response(e.message, { status: 500 })
    }
}
```

**Example Express**

```javascript
// graphql.js

import {
    GraphqlQueryStore,
    processGraphqlRequest,
} from '@dashdot/graphql-server'
import { createSchema } from './createSchema'
import { createRequestContext } from './requestContext'
import app from './app'

const schema = createSchema()
const store = new GraphqlQueryStore(schema)

app.post('/api/graphql', async (req, res) => {
    try {
        const { status, text, body } = await processGraphqlRequest({ 
            store,
            context: createRequestContext(req),
            readRequestBody: async () => {
                // Assuming you're using bodyParser or similar middleware
                return req.body
            },
        })
        if (text) {
            res.status(status).send(text)
        } else if (body) {
            res.status(status).json(body)
        }
    } catch (e) {
        res.status(500).send(e.message)
    }
})
```