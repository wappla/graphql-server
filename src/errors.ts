/* eslint-disable default-param-last */

/* eslint-disable max-classes-per-file */
const INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
const VALIDATION_ERROR = 'VALIDATION_ERROR'
const CONTEXT_ERROR = 'CONTEXT_ERROR'
const UNAUTHORIZED_ERROR = 'UNAUTHORIZED_ERROR'
const USER_INPUT_ERROR = 'USER_INPUT_ERROR'

export class GraphqlError extends Error {
    originalError: Error | null
    code: string
    extensions: any
    static CODE: string
    errors?: any

    constructor(
        message = 'Something went wrong',
        code = INTERNAL_SERVER_ERROR,
        originalError?: Error | null,
        extensions?: {
            errors: any
        }
    ) {
        super(message)
        this.originalError = originalError || null
        this.code = code
        if (!this.name) {
            this.name = 'GraphqlError'
        }
        if (extensions) {
            const { errors } = extensions
            if (errors) {
                this.errors = errors
            }
        }
        this.extensions = {
            ...extensions,
            code,
        }
    }
}

GraphqlError.CODE = INTERNAL_SERVER_ERROR

export class GraphqlValidationError extends GraphqlError {
    constructor(
        message = 'Invalid GraphQL query',
        originalError?: Error | null,
        extensions?: {
            errors: any
        }
    ) {
        super(message, VALIDATION_ERROR, originalError, extensions)
        this.name = 'GraphqlValidationError'
    }
}

GraphqlValidationError.CODE = VALIDATION_ERROR

export class GraphqlContextError extends GraphqlError {
    constructor(
        message = 'Context creation failed.',
        originalError?: Error | null,
        extensions?: {
            errors: any
        }
    ) {
        super(message, CONTEXT_ERROR, originalError, extensions)
        this.name = 'GraphqlContextError'
    }
}

GraphqlContextError.CODE = CONTEXT_ERROR

export class GraphqlUnauthorizedError extends GraphqlError {
    constructor(
        message = 'Unauthorized.',
        originalError: Error | null,
        extensions: {
            errors: any
        }
    ) {
        super(message, UNAUTHORIZED_ERROR, originalError, extensions)
        this.name = 'GraphqlUnauthorizedError'
    }
}

GraphqlUnauthorizedError.CODE = UNAUTHORIZED_ERROR

export class GraphqlUserInputError extends GraphqlError {
    constructor(
        message = 'Bad user input error.',
        originalError: Error | null,
        extensions: {
            errors: any
        }
    ) {
        super(message, USER_INPUT_ERROR, originalError, extensions)
        this.name = 'GraphqlUserInputError'
    }
}

GraphqlUserInputError.CODE = USER_INPUT_ERROR
