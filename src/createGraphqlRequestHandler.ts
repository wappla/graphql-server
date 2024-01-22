import { IncomingMessage } from 'http'
import processGraphqlRequest from './processGraphqlRequest'
import { readRequestBody } from './utils'

export default function createGraphqlRequestHandler(
    store: any,
    context: any,
    processFileUploads?: any
) {
    return async (
        req: IncomingMessage,
        res: {
            writeHead: (arg0: number, arg1?: { 'Content-Type': string } | undefined) => void
            end: (arg0: string) => void
        }
    ) => {
        const { status, text, body } = await processGraphqlRequest(req, {
            store,
            context,
            processFileUploads,
            readRequestBody,
        })
        if (text) {
            res.writeHead(status)
            res.end(text)
        }
        if (body) {
            res.writeHead(status, {
                'Content-Type': 'application/json',
            })
            res.end(JSON.stringify(body))
        }
    }
}
