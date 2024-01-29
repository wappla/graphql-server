import { IncomingMessage, ServerResponse } from 'http'
import processGraphqlRequest from './processGraphqlRequest'
import { readRequestBody } from './utils'
import GraphqlQueryStore from './GraphqlQueryStore'

export default function createGraphqlRequestHandler(
    store: GraphqlQueryStore,
    context: any,
    processFileUploads?:  (req: IncomingMessage) => Promise<any>
) {
    return async (
        req: IncomingMessage,
        res: ServerResponse
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
