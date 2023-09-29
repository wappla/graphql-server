// eslint-disable-next-line import/extensions
import {
    badRequestJson,
    badRequest,
    methodNotAllowed,
    json
} from './responses'
import {
    GraphqlValidationError,
    GraphqlContextError
} from './errors'

export default async function processGraphqlRequest(req, {
    store,
    context = {},
    processFileUploads,
    readRequestBody,
}) {
    if (!store) {
        throw Error('No query store provided.')
    }
    if (!readRequestBody) {
        throw Error('No method provided to read the incoming request data.')
    }
    if (req.method !== 'POST') {
        return methodNotAllowed()
    }
    let jsonBody = null
    const contentType = req.headers['content-type']
    if (contentType && contentType.startsWith('multipart/form-data')) {
        if (!processFileUploads) {
            return badRequest('File upload is not supported.')
        }
        try {
            jsonBody = await processFileUploads(req)
        } catch (e) {
            return badRequest(`Failed to upload file. ${e.message}`)
        }
    } else {
        const body = await readRequestBody(req)
        try {
            jsonBody = JSON.parse(body)
        } catch (e) {
            return badRequest('Unable to parse the request body.')
        }
    }
    const { query, variables } = jsonBody
    if (!query) {
        return badRequest('The query body param is required.')
    }
    const queryId = store.createId(query)
    let compiledQuery = null
    if (store.has(queryId)) {
        compiledQuery = store.get(queryId)
    } else {
        try {
            compiledQuery = store.create(query, variables)
        } catch (e) {
            if (e instanceof GraphqlValidationError) {
                const { errors, message } = e
                return badRequestJson({ message, errors })
            }
            return badRequest(e.message)
        }
    }
    let queryContext = context
    if (typeof context === 'function') {
        try {
            queryContext = await context(req, compiledQuery.query.name)
        } catch (e) {
            if (e instanceof GraphqlContextError) {
                const { errors, message } = e
                return badRequestJson({ message, errors })
            }
            return badRequest(e.message)
        }
    }
    const root = {}
    const result = await compiledQuery.query(root, queryContext, variables)
    return json(result)
}
