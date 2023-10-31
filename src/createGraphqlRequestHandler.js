import { readRequestBody } from './utils'
import processGraphqlRequest from './processGraphqlRequest'

export default function createGraphqlRequestHandler(store, context, processFileUploads) {
    return async (req, res) => {
        const {
            status,
            text,
            body,
        } = await processGraphqlRequest(req, {
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
                'Content-Type': 'application/json'
            })
            res.end(JSON.stringify(body))
        }
    }
}
