import { jest } from '@jest/globals'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { GraphqlContextError } from '../errors'
import createGraphqlRequestHandler from '../createGraphqlRequestHandler'
import GraphqlQueryStore from '../GraphqlQueryStore'
import { RequestMock, ResponseMock } from '../testing'

const SUCCESS = 200
const METHOD_NOT_ALLOWED = 405
const BAD_REQUEST = 400
const INTROSPECTION_QUERY = `
    query {
        __schema {
            queryType {
                name
            }
        }
    }
`
const CONTENT_TYPE_JSON = {
    'Content-Type': 'application/json'
}

const name = 'test'
const testSchema = makeExecutableSchema({
    typeDefs: `
        type Query {
            name: String
        }
    `,
    resolvers: {
        Query: {
            name: () => name,
        },
    },
})

test('Test if graphqlHandler only handles the POST requests.', async () => {
    const queryStore = new GraphqlQueryStore(testSchema)
    const context = jest.fn()
    const graphqlHandler = createGraphqlRequestHandler(queryStore, context)
    const request = new RequestMock({ method: 'GET' })
    const response = new ResponseMock()
    await graphqlHandler(request, response)
    expect(response.writeHead).toHaveBeenCalledWith(METHOD_NOT_ALLOWED)
})

test('Test if graphqlHandler validates request body .', async () => {
    const queryStore = new GraphqlQueryStore(testSchema)
    const context = jest.fn()
    const graphqlHandler = createGraphqlRequestHandler(queryStore, context)
    const request = new RequestMock()
    const response = new ResponseMock()
    const graphqlHandlerPromise = graphqlHandler(request, response)
    request.send({})
    await graphqlHandlerPromise
    expect(response.writeHead).toHaveBeenCalledWith(BAD_REQUEST)
})

test('Test if graphqlHandler catches errors on the context function.', async () => {
    const queryStore = new GraphqlQueryStore(testSchema)
    const context = jest.fn(() => (
        new Promise((resolve, reject) => {
            reject(new GraphqlContextError())
        })
    ))
    const graphqlHandler = createGraphqlRequestHandler(queryStore, context)
    const request = new RequestMock()
    const response = new ResponseMock()
    const graphqlHandlerPromise = graphqlHandler(request, response)
    const query = INTROSPECTION_QUERY
    request.send({ query })
    await graphqlHandlerPromise
    expect(response.writeHead).toHaveBeenCalledWith(BAD_REQUEST, CONTENT_TYPE_JSON)
})

test('Test if graphqlHandler catches errors on the resolver.', async () => {
    const errorResolver = jest.fn(() => (
        new Promise((resolve, reject) => {
            reject(new Error())
        })
    ))
    const errorSchema = makeExecutableSchema({
        typeDefs: `
            type Query {
                error: String
            }
        `,
        resolvers: {
            Query: {
                error: errorResolver
            },
        },
    })

    const queryStore = new GraphqlQueryStore(errorSchema)
    const context = jest.fn()
    const graphqlHandler = createGraphqlRequestHandler(queryStore, context)
    const request = new RequestMock()
    const response = new ResponseMock()
    const graphqlHandlerPromise = graphqlHandler(request, response)
    const query = `
        query {
            error
        }
    `
    request.send({ query })
    await graphqlHandlerPromise
    expect(response.writeHead).toHaveBeenCalledWith(SUCCESS, CONTENT_TYPE_JSON)
})

test('Test if graphqlHandler calls the context function and handles the query.', async () => {
    const queryStore = new GraphqlQueryStore(testSchema)
    const context = jest.fn()
    const graphqlHandler = createGraphqlRequestHandler(queryStore, context)
    const request = new RequestMock()
    const response = new ResponseMock()
    const graphqlHandlerPromise = graphqlHandler(request, response)
    const operationName = 'test'
    const query = `
        query ${operationName} {
            name
        }
    `
    request.send({ query })
    await graphqlHandlerPromise
    expect(context).toHaveBeenCalledWith(request, operationName)
    expect(response.writeHead).toHaveBeenCalledWith(SUCCESS, CONTENT_TYPE_JSON)
})

test('Test if graphqlHandler handles invalid query.', async () => {
    const queryStore = new GraphqlQueryStore(testSchema)
    const context = jest.fn()
    const graphqlHandler = createGraphqlRequestHandler(queryStore, context)
    const request = new RequestMock()
    const response = new ResponseMock()
    const graphqlHandlerPromise = graphqlHandler(request, response)
    const query = `
        query {
            falseValue
        }
    `
    request.send({ query })
    await graphqlHandlerPromise
    expect(context).not.toHaveBeenCalled()
    expect(response.writeHead).toHaveBeenCalledWith(400, CONTENT_TYPE_JSON)
})

test('Test if graphqlHandler handles query variables.', async () => {
    const schema = makeExecutableSchema({
        typeDefs: `
            type Query {
                test(id: ID!): ID
            }
        `,
        resolvers: {
            Query: {
                test: (_, { id }) => ({
                    id
                }),
            },
        },
    })
    const queryStore = new GraphqlQueryStore(schema)
    const context = jest.fn()
    const graphqlHandler = createGraphqlRequestHandler(queryStore, context)
    const request = new RequestMock()
    const response = new ResponseMock()
    const graphqlHandlerPromise = graphqlHandler(request, response)
    const id = 1
    const variables = { id }
    const query = `
        query test($id: ID!) {
            test(id: $ID)
        }
    `
    request.send({ query, variables })
    await graphqlHandlerPromise
    expect(context).not.toHaveBeenCalled()
    expect(response.writeHead).toHaveBeenCalledWith(200, CONTENT_TYPE_JSON)
    expect(response.data.test).toEqual(id)
})

test('Test if graphqlHandler protects against too complex queries.', async () => {
    const schema = makeExecutableSchema({
        typeDefs: `
            type Query {
                post: Post
            }
            type Post {
                id: ID
                author: Author
            }
            type Author {
                id: ID
                post: Post
            }
        `,
        resolvers: {
            Query: {
                post: () => ({
                    id: 1
                }),
            },
            Post: {
                author: () => ({
                    id: 1
                }),
            },
            Author: {
                post: () => ({
                    id: 1
                }),
            }
        },
    })
    const queryComplexity = {
        maximumComplexity: 10,
        defaultComplexity: 5 // each field add a complexity of 5
    }
    const queryStore = new GraphqlQueryStore(schema, { queryComplexity })
    const context = jest.fn()
    const graphqlHandler = createGraphqlRequestHandler(queryStore, context)
    const request = new RequestMock()
    const response = new ResponseMock()
    const graphqlHandlerPromise = graphqlHandler(request, response)
    const query = `
        query {
            post {
                author {
                    post {
                        author {
                            id
                        }
                    }
                }
            }
        }
    `
    request.send({ query })
    await graphqlHandlerPromise
    expect(context).not.toHaveBeenCalled()
    expect(response.writeHead).toHaveBeenCalledWith(400, CONTENT_TYPE_JSON)
})
