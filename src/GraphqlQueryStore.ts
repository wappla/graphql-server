/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import { createHash } from 'crypto'
import { GraphQLSchema, ValidationRule, parse, specifiedRules, validate } from 'graphql'
import { compileQuery, isCompiledQuery } from 'graphql-jit'
import { createComplexityRule, simpleEstimator } from 'graphql-query-complexity'
import { GraphqlValidationError } from './errors'

export type QueryComplexityOptions = {
    maximumComplexity?: number
    defaultComplexity?: number
}

export type GraphqlQueryStoreOptions = {
    validationRules?: [ValidationRule]
    queryComplexity?: QueryComplexityOptions
} 

export default class GraphqlQueryStore {
    schema: GraphQLSchema
    validationRules: any
    maximumComplexity: number
    defaultComplexity: number
    store: Map<string, any>

    constructor(
        schema: GraphQLSchema,
        options?: GraphqlQueryStoreOptions
    ) {
        this.schema = schema
        this.validationRules = options?.validationRules || []
        this.maximumComplexity = options?.queryComplexity?.maximumComplexity || 1000
        this.defaultComplexity = options?.queryComplexity?.defaultComplexity || 1
        this.store = new Map()
    }

    createId(query: string) {
        const hash = createHash('sha256')
        hash.update(query)
        return hash.digest('hex')
    }

    get(id: string) {
        return this.store.get(id)
    }

    has(id: string) {
        return this.store.has(id)
    }

    generateValidationRules(variables: any) {
        const complexityRule = createComplexityRule({
            maximumComplexity: this.maximumComplexity,
            estimators: [simpleEstimator({ defaultComplexity: this.defaultComplexity })],
            variables,
        })
        return [...specifiedRules, complexityRule, ...this.validationRules]
    }

    create(query: string, variables: any) {
        const validationErrors = validate(
            this.schema,
            parse(query),
            this.generateValidationRules(variables)
        )
        if (validationErrors.length > 0) {
            throw new GraphqlValidationError('Invalid query.', {
                extensions: {
                    errors: validationErrors,
                }
            })
        }
        const compiledQuery = compileQuery(this.schema, parse(query))
        if (!isCompiledQuery(compiledQuery)) {
            throw new GraphqlValidationError('Invalid query.', {
                extensions: {
                    errors: compiledQuery.errors,
                }
            })
        }
        const id = this.createId(query)
        this.store.set(id, compiledQuery)
        return compiledQuery
    }
}
