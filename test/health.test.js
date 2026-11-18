const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const server = require('../server')

let httpServer
let baseUrl

before(async () => {
    httpServer = server.listen(0)
    await new Promise((resolve) => httpServer.once('listening', resolve))
    baseUrl = `http://127.0.0.1:${httpServer.address().port}`
})

after(async () => {
    await new Promise((resolve) => httpServer.close(resolve))
})

for (const path of ['/health', '/api/health']) {
    test(`GET ${path} returns 200 with { status: 'ok' }`, async () => {
        const res = await fetch(`${baseUrl}${path}`)
        assert.equal(res.status, 200)
        assert.match(res.headers.get('content-type'), /application\/json/)
        assert.deepEqual(await res.json(), { status: 'ok' })
    })
}

test('GET /api/foods still returns the foods collection', async () => {
    const res = await fetch(`${baseUrl}/api/foods`)
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(await res.json()))
})
