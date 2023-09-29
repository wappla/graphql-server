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
        this.validationRules = validationRules
        this.maximumComplexity = maximumComplexity
        this.defaultComplexity = defaultComplexity
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

    generateValidationRules(variables) {
        const complexityRule = createComplexityRule({
            maximumComplexity: this.maximumComplexity,
            estimators: [
                simpleEstimator({ defaultComplexity: this.defaultComplexity })
            ],
            variables,
        })
        return [
            ...specifiedRules,
            complexityRule,
            ...this.validationRules,
        ]
    }

    create(query, variables) {
        const validationErrors = validate(
            this.schema,
            parse(query),
            this.generateValidationRules(variables),
        )
        if (validationErrors.length > 0) {
            throw new GraphqlValidationError('Invalid query.', null, {
                errors: validationErrors
            })
        }
        const compiledQuery = compileQuery(this.schema, parse(query))
        if (!isCompiledQuery(compiledQuery)) {
            throw new GraphqlValidationError('Invalid query.', null, {
                errors: compiledQuery.errors
            })
        }
        const id = this.createId(query)
        this.store.set(id, compiledQuery)
        return compiledQuery
    }
}
