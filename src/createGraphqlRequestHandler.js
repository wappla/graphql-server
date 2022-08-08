// eslint-disable-next-line import/extensions
import { processRequest } from 'graphql-upload'
import {
    badRequestJson,
    badRequest,
    methodNotAllowed,
    readRequestBody,
    json
} from './utils'
import {
    GraphqlValidationError,
    GraphqlContextError
} from './errors'

export default function createGraphqlRequestHandler(store, context = {}) {
    return async (req, res) => {
        if (req.method !== 'POST') {
            return methodNotAllowed(res)
        }
        let jsonBody = null
        const contentType = req.headers['content-type']
        if (contentType && contentType.startsWith('multipart/form-data')) {
            try {
                jsonBody = await processFileUploads(req, res)
            } catch (e) {
                return badRequest(res, `Failed to upload file. ${e.message}`)
            }
        } else {
            const body = await readRequestBody(req)
            try {
                jsonBody = JSON.parse(body)
            } catch (e) {
                return badRequest(res, 'Unable to parse the request body.')
            }
        }
        const { query, variables } = jsonBody
        if (!query) {
            return badRequest(res, 'The query body param is required.')
        }

        const queryId = store.createId(query)
        let compiledQuery = null
        if (store.has(queryId)) {
            compiledQuery = store.get(queryId)
        } else {
            try {
                compiledQuery = store.create(query)
            } catch (e) {
                if (e instanceof GraphqlValidationError) {
                    const { errors, message } = e
                    return badRequestJson(res, { message, errors })
                }
                return badRequest(res, e.message)
            }
        }
        let queryContext = context
        if (typeof context === 'function') {
            try {
                queryContext = await context(req, compiledQuery.query.name)
            } catch (e) {
                if (e instanceof GraphqlContextError) {
                    const { errors, message } = e
                    return badRequestJson(res, { message, errors })
                }
                return badRequest(res, e.message)
            }
        }
        const root = {}
        const result = await compiledQuery.query(root, queryContext, variables)
        return json(res, result)
    }
}
