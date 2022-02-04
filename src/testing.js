/* eslint-disable max-classes-per-file */
import { EventEmitter } from 'events'
import http from 'http'
import testListen from 'test-listen'
import { GraphQLClient } from 'graphql-request'

export function createTestClient(server, headers) {
    return new GraphQLClient(server.uri, { headers })
}

export async function createTestServer(handler) {
    const server = http.createServer(handler)
    const uri = await testListen(server)
    server.uri = uri
    return server
}

export class RequestMock extends EventEmitter {
    constructor({
        method = 'POST'
    } = {}) {
        super()
        this.method = method
        this.headers = {}
    }

    send(data) {
        if (Buffer.isBuffer(data)) {
            this.emit('data', data)
        } else if (typeof data === 'object' || typeof data === 'number') {
            this.emit('data', Buffer.from(JSON.stringify(data)))
        } else if (typeof data === 'string') {
            this.emit('data', Buffer.from(data))
        }
        this.emit('end')
    }
}

export class ResponseMock extends EventEmitter {
    constructor() {
        super()
        this.data = null
        this.statusCode = null
        this.headers = null
        this.writeHead = jest.fn((statusCode, headers) => {
            this.statusCode = statusCode
            this.headers = headers
        })
        this.end = jest.fn((data) => {
            this.data = data
        })
    }
}
