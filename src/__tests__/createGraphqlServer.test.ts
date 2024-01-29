import { makeExecutableSchema } from '@graphql-tools/schema'
import { jest } from '@jest/globals'
import { gql } from 'graphql-request'
import GraphqlQueryStore from '../GraphqlQueryStore'
import createGraphqlRequestHandler from '../createGraphqlRequestHandler'
import { GraphqlContextError } from '../errors'
import { createTestClient, createTestServer } from '../testing'

const reject = (error) =>
    new Promise((res, rej) => {
        rej(error)
    })

const createGraphqlServer = async (schema, context = jest.fn()) => {
    const store = new GraphqlQueryStore(schema)
    const graphqlHandler = createGraphqlRequestHandler(store, context)
    return createTestServer(graphqlHandler)
}

test('if a basic query can be resolved.', async () => {
    const name = 'test'
    const nameResolver = jest.fn().mockReturnValue(name)
    const schema = makeExecutableSchema({
        typeDefs: `
            type Query {
                name: String
            }
        `,
        resolvers: {
            Query: {
                name: nameResolver,
            },
        },
    })
    const { server, url } = await createGraphqlServer(schema)
    const client = await createTestClient(url)
    const QUERY = gql`
        query {
            name
        }
    `
    expect.assertions(2)
    try {
        const data = await client.request(QUERY)
        expect(data.name).toEqual(name)
        expect(nameResolver).toHaveBeenCalled()
    } finally {
        server.close()
    }
})

test('if an error get resolved correctly.', async () => {
    const name = 'test'
    const message = 'error'
    const code = 'ERROR_CODE'
    const error = new Error(message)
    // @ts-ignore
    error.extensions = { code }
    const nameResolver = jest.fn().mockReturnValue(name)
    const errorResolver = jest.fn().mockReturnValue(error)
    const schema = makeExecutableSchema({
        typeDefs: `
            type Query {
                name: String
                error: String
            }
        `,
        resolvers: {
            Query: {
                name: nameResolver,
                error: errorResolver,
            },
        },
    })
    const { server, url } = await createGraphqlServer(schema)
    const client = await createTestClient(url)
    const QUERY = gql`
        query {
            name
            error
        }
    `
    expect.assertions(8)
    try {
        await client.request(QUERY)
    } catch ({ response }) {
        expect(response.status).toEqual(200)
        expect(response.data.name).toEqual(name)
        expect(response.data.error).toEqual(null)
        expect(response.errors.length).toEqual(1)
        expect(response.errors[0].message).toEqual(message)
        expect(response.errors[0].path[0]).toEqual('error')
        expect(response.errors[0].extensions.code).toEqual(code)
        expect(errorResolver).toHaveBeenCalled()
    } finally {
        server.close()
    }
})

test('if an error in the context function is returned correctly.', async () => {
    const name = 'test'
    const message = 'error'
    const error = new GraphqlContextError(message, {
        extensions: {
            errors: [
                {
                    message,
                    path: null,
                    extensions: {
                        code: GraphqlContextError.CODE,
                    },
                },
            ],
        }
    })
    const nameResolver = jest.fn().mockReturnValue(name)
    const context = jest.fn().mockImplementation(() => reject(error))
    const schema = makeExecutableSchema({
        typeDefs: `
            type Query {
                name: String
            }
        `,
        resolvers: {
            Query: {
                name: nameResolver,
            },
        },
    })
    const { server, url } = await createGraphqlServer(schema, context)
    const client = await createTestClient(url)
    const QUERY = gql`
        query {
            name
        }
    `
    expect.assertions(6)
    try {
        await client.request(QUERY)
    } catch ({ response }) {
        expect(response.status).toEqual(400)
        expect(response.data).not.toBeDefined()
        expect(response.extensions.errors.length).toEqual(1)
        expect(response.extensions.errors[0].message).toBeDefined()
        expect(response.extensions.errors[0].path).toEqual(null)
        expect(response.extensions.errors[0].extensions.code).toEqual(GraphqlContextError.CODE)
    } finally {
        server.close()
    }
})
