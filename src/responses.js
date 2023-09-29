const OK = 200
const METHOD_NOT_ALLOWED = 405
const BED_REQUEST = 400

export const methodNotAllowed = (text = 'Method Not Allowed') => ({
    status: METHOD_NOT_ALLOWED,
    text
})

export const badRequest = (text = 'Bad Request') => ({
    status: BED_REQUEST,
    text
})

export const json = (body, status = OK) => ({
    status,
    body,
})

export const badRequestJson = (result) => (
    json(result, BED_REQUEST)
)
