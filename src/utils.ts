const OK = 200
const METHOD_NOT_ALLOWED = 405
const BED_REQUEST = 400

export const readRequestBody = (req: {
    on: (
        arg0: string,
        arg1: (chunk: any) => number
    ) => {
        (): any
        new (): any
        on: {
            (arg0: string, arg1: (error: any) => void): {
                (): any
                new (): any
                on: { (arg0: string, arg1: () => void): void; new (): any }
            }
            new (): any
        }
    }
}) =>
    new Promise((resolve, reject) => {
        const body: any[] = []
        req.on('data', (chunk: any) => body.push(chunk))
            .on('error', (error: Error) => reject(error))
            .on('end', () => resolve(JSON.parse(Buffer.concat(body).toString())))
    })

export const methodNotAllowed = (
    res: { writeHead: (arg0: number) => void; end: (arg0: string) => void },
    message = 'Method Not Allowed'
) => {
    res.writeHead(METHOD_NOT_ALLOWED)
    res.end(message)
}

export const badRequest = (
    res: { writeHead: (arg0: number) => void; end: (arg0: string) => void },
    message = 'Bad Request'
) => {
    res.writeHead(BED_REQUEST)
    res.end(message)
}

export const json = (
    res: {
        writeHead: (arg0: number, arg1: { 'Content-Type': string }) => void
        end: (arg0: string) => void
    },
    result: any,
    statusCode = OK
) => {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
    })
    res.end(JSON.stringify(result))
}

export const badRequestJson = (res: any, result: any) => json(res, result, BED_REQUEST)
