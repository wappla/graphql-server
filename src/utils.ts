import { IncomingMessage, ServerResponse } from 'http'

const OK = 200
const METHOD_NOT_ALLOWED = 405
const BAD_REQUEST = 400

export const readRequestBody = (req: IncomingMessage) =>
    new Promise((resolve, reject) => {
        const body: any[] = []
        req.on('data', (chunk: any) => body.push(chunk))
            .on('error', (error: any) => reject(error))
            .on('end', () => resolve(JSON.parse(Buffer.concat(body).toString())))
    })

export const methodNotAllowed = (res: ServerResponse, message = 'Method Not Allowed') => {
    res.writeHead(METHOD_NOT_ALLOWED)
    res.end(message)
}

export const badRequest = (res: ServerResponse, message = 'Bad Request') => {
    res.writeHead(BAD_REQUEST)
    res.end(message)
}

export const json = (res: ServerResponse, result: any, statusCode = OK) => {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
    })
    res.end(JSON.stringify(result))
}

export const badRequestJson = (res: any, result: any) => json(res, result, BAD_REQUEST)
