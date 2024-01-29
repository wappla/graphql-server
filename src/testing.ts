/* eslint-disable max-classes-per-file */
import { RequestListener, createServer } from 'http'
import { jest } from '@jest/globals'
import { EventEmitter } from 'events'
import { GraphQLClient } from 'graphql-request'
import testListen from 'test-listen'

export function createTestClient(url: string, headers = {}) {
    return new GraphQLClient(url, { headers })
}

export async function createTestServer(handler: RequestListener) {
    const server = createServer(handler)
    const url = await testListen(server)
    return {
        server,
        url,
    }
}

export class RequestMock extends EventEmitter {
    method: string
    headers?: any

    constructor({ method = 'POST' } = {}) {
        super()
        this.method = method
        this.headers = {}
    }

    send(data: WithImplicitCoercion<string | Uint8Array | readonly number[]>) {
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
    data: any
    statusCode: any
    headers: any
    writeHead: any
    end: any

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
