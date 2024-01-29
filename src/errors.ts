/* eslint-disable default-param-last */
import { GraphQLError, GraphQLErrorOptions  } from 'graphql/error'

/* eslint-disable max-classes-per-file */
export const VALIDATION_ERROR = 'VALIDATION_ERROR'
export const CONTEXT_ERROR = 'CONTEXT_ERROR'
export const UNAUTHORIZED_ERROR = 'UNAUTHORIZED_ERROR'
export const USER_INPUT_ERROR = 'USER_INPUT_ERROR'

export class GraphqlValidationError extends GraphQLError {
    static CODE: string = VALIDATION_ERROR
    
    constructor(
        message = 'Invalid GraphQL query',
        options?: GraphQLErrorOptions
    ) {
        super(message, {
            extensions: {
                code: VALIDATION_ERROR,
                ...options?.extensions,
            },
            ...options
        })
    }
}

export class GraphqlContextError extends GraphQLError {
    static CODE: string = CONTEXT_ERROR

    constructor(
        message = 'Context creation failed.',
        options?: GraphQLErrorOptions
    ) {
        super(message, {
            extensions: {
                code: CONTEXT_ERROR,
                ...options?.extensions,
            },
            ...options
        })
    }
}

export class GraphqlUnauthorizedError extends GraphQLError {
    static CODE: string = UNAUTHORIZED_ERROR

    constructor(
        message = 'Unauthorized.',
        options?: GraphQLErrorOptions
    ) {
        super(message, {
            extensions: {
                code: UNAUTHORIZED_ERROR,
                ...options?.extensions,
            },
            ...options
        })
    }
}

export class GraphqlUserInputError extends GraphQLError {
    static CODE: string = USER_INPUT_ERROR

    constructor(
        message = 'Bad user input error.',
        options?: GraphQLErrorOptions
    ) {
        super(message, {
            extensions: {
                code: USER_INPUT_ERROR,
                ...options?.extensions,
            },
            ...options
        })
    }
}
