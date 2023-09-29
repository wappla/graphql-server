const OK = 200
const METHOD_NOT_ALLOWED = 405
const BED_REQUEST = 400

export const readRequestBody = (req) => (
    new Promise((resolve, reject) => {
        const body = []
        req
            .on('data', (chunk) => body.push(chunk))
            .on('error', (error) => reject(error))
            .on('end', () => resolve(
                JSON.parse(Buffer.concat(body).toString())
            ))
    })
)

export const methodNotAllowed = (
    res,
    message = 'Method Not Allowed'
) => {
    res.writeHead(METHOD_NOT_ALLOWED)
    res.end(message)
}

export const badRequest = (
    res,
    message = 'Bad Request'
) => {
    res.writeHead(BED_REQUEST)
    res.end(message)
}

export const json = (res, result, statusCode = OK) => {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json'
    })
    res.end(JSON.stringify(result))
}

export const badRequestJson = (res, result) => (
    json(res, result, BED_REQUEST)
)
