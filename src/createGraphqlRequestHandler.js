import processGraphqlRequest from './processGraphqlRequest'

export default function createGraphqlRequestHandler(store, context = {}) {
    return async (req, res) => {
        const {
            statusCode,
            text,
            body,
        } = await processGraphqlRequest(req, store, context)
        if (text) {
            res.writeHead(statusCode)
            res.end(text)
        }
        if (body) {
            res.writeHead(statusCode, {
                'Content-Type': 'application/json'
            })
            res.end(JSON.stringify(body))
        }
    }
}
