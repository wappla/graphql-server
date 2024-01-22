// Jest configuration
const config = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    transform: {
        '^.+\\.(t|j)sx?$': '@swc/jest',
    },
}

export default config
