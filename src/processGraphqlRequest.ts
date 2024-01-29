// eslint-disable-next-line import/extensions
import { IncomingMessage } from 'http'
import { GraphqlContextError, GraphqlValidationError } from './errors'
import { badRequest, badRequestJson, json, methodNotAllowed } from './responses'
import GraphqlQueryStore from './GraphqlQueryStore'

type GraphqlResponse = {
    status: number
    text?: string
    body?: any
}

type ProcessGraphqlRequestOptions = {
    store: GraphqlQueryStore
    context: any
    processFileUploads?: (req: IncomingMessage) => Promise<any>
    readRequestBody: (req: IncomingMessage) => Promise<any>
}

export default async function processGraphqlRequest(
    req: IncomingMessage,
    {
        store,
        context = {},
        processFileUploads,
        readRequestBody,
    }: ProcessGraphqlRequestOptions
): Promise<GraphqlResponse> {
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
        } catch (e: any) {
            return badRequest(`Failed to upload file. ${e.message}`)
        }
    } else {
        try {
            jsonBody = await readRequestBody(req)
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
        } catch (e: any) {
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
        } catch (e: any) {
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
