/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import { validate, parse, specifiedRules } from 'graphql'
import { compileQuery, isCompiledQuery } from 'graphql-jit'
import { createComplexityRule, simpleEstimator } from 'graphql-query-complexity'
import { createHash } from 'crypto'
import { GraphqlValidationError } from './errors'

export default class GraphqlQueryStore {
    constructor(schema, {
        validationRules = [],
        queryComplexity: {
            maximumComplexity = 1000,
            defaultComplexity = 1,
        } = {}
    } = {}) {
        this.schema = schema
        const complexityRule = createComplexityRule({
            maximumComplexity,
            estimators: [simpleEstimator({ defaultComplexity })],
        })
        this.validationRules = [
            ...specifiedRules,
            complexityRule,
            ...validationRules,
        ]
        this.store = new Map()
    }

    createId(query) {
        const hash = createHash('sha256')
        hash.update(query)
        return hash.digest('hex')
    }

    get(id) {
        return this.store.get(id)
    }

    has(id) {
        return this.store.has(id)
    }

    create(query) {
        const validationErrors = validate(
            this.schema,
            parse(query),
            this.validationRules,
        )
        if (validationErrors.length > 0) {
            throw new GraphqlValidationError('Invalid query.', {
                errors: validationErrors
            })
        }
        const compiledQuery = compileQuery(this.schema, parse(query))
        if (!isCompiledQuery(compiledQuery)) {
            throw new GraphqlValidationError('Invalid query.', {
                errors: compiledQuery.errors
            })
        }
        const id = this.createId(query)
        this.store.set(id, compiledQuery)
        return compiledQuery
    }
}
