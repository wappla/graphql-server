const OK = 200
const METHOD_NOT_ALLOWED = 405
const BAD_REQUEST = 400

export const methodNotAllowed = (text = 'Method Not Allowed') => ({
    status: METHOD_NOT_ALLOWED,
    text,
})

export const badRequest = (text = 'Bad Request') => ({
    status: BAD_REQUEST,
    text,
})

export const json = (body: { message: string; extensions: any }, status = OK) => ({
    status,
    body,
})

export const badRequestJson = (result: { message: string; extensions: any }) =>
    json(result, BAD_REQUEST)
