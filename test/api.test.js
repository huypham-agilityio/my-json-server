const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const path = require('node:path')

const ROOT = path.join(__dirname, '..')
const BASE_URL = 'http://localhost:3000'
const STARTUP_TIMEOUT_MS = 10000
// The old misspelled key, built from parts so the typo itself appears nowhere in the repo.
const MISSPELLED_KEY = 'ingredi' + 'ants'

let server

function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['server.js'], { cwd: ROOT })
    let stdout = ''
    let stderr = ''

    const fail = (reason) => {
      clearTimeout(timer)
      child.kill()
      reject(new Error(`${reason}\nstdout:\n${stdout}\nstderr:\n${stderr}`))
    }

    const timer = setTimeout(
      () => fail(`Server did not start within ${STARTUP_TIMEOUT_MS} ms`),
      STARTUP_TIMEOUT_MS
    )

    child.stdout.on('data', (chunk) => {
      stdout += chunk
      if (stdout.includes('JSON Server is running')) {
        clearTimeout(timer)
        child.removeAllListeners('exit')
        resolve(child)
      }
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })
    child.on('error', (err) => fail(`Server failed to spawn: ${err.message}`))
    child.on('exit', (code) => fail(`Server exited early with code ${code}`))
  })
}

async function getJson(urlPath) {
  const res = await fetch(BASE_URL + urlPath)
  const body = res.status === 200 ? await res.json() : await res.text()
  return { res, body }
}

function assertNameValueArray(arr, label) {
  assert.ok(Array.isArray(arr), `${label} should be an array`)
  assert.ok(arr.length > 0, `${label} should not be empty`)
  for (const entry of arr) {
    assert.equal(typeof entry, 'object', `${label} entries should be objects`)
    assert.equal(typeof entry.name, 'string', `${label}.name should be a string`)
    assert.equal(typeof entry.value, 'string', `${label}.value should be a string`)
  }
}

before(async () => {
  server = await startServer()
})

after(() => {
  if (server) server.kill()
})

test('GET /api/foods returns all 10 foods', async () => {
  const { res, body } = await getJson('/api/foods')
  assert.equal(res.status, 200)
  assert.ok(Array.isArray(body))
  assert.equal(body.length, 10)
})

test('every food has the documented fields', async () => {
  const { body } = await getJson('/api/foods')
  for (const food of body) {
    assert.equal(typeof food.id, 'string', 'id should be a string')
    for (const key of ['title', 'info', 'image', 'category', 'description']) {
      assert.equal(typeof food[key], 'string', `food ${food.id}: ${key} should be a string`)
    }
    assertNameValueArray(food.nutrition, `food ${food.id}: nutrition`)
    assertNameValueArray(food.ingredients, `food ${food.id}: ingredients`)
  }
})

test('no food has the old misspelled ingredients key', async () => {
  const { body } = await getJson('/api/foods')
  for (const food of body) {
    assert.ok(!(MISSPELLED_KEY in food), `food ${food.id} still has "${MISSPELLED_KEY}"`)
  }
})

test('GET /api/foods/1 returns a single food', async () => {
  const { res, body } = await getJson('/api/foods/1')
  assert.equal(res.status, 200)
  assert.equal(body.id, '1')
  assert.equal(body.title, 'Banana')
  assert.ok(Array.isArray(body.ingredients))
  assert.deepEqual(body.ingredients[0], { name: 'Bread', value: '20g' })
})

test('GET /api/foods/999 returns 404', async () => {
  const { res } = await getJson('/api/foods/999')
  assert.equal(res.status, 404)
})

test('/foods and /api/foods return the same data', async () => {
  const withPrefix = await getJson('/api/foods/1')
  const withoutPrefix = await getJson('/foods/1')
  assert.equal(withoutPrefix.res.status, 200)
  assert.deepEqual(withoutPrefix.body, withPrefix.body)
})

test('?category=Lunch filters by category', async () => {
  const { res, body } = await getJson('/api/foods?category=Lunch')
  assert.equal(res.status, 200)
  assert.ok(body.length > 0)
  for (const food of body) assert.equal(food.category, 'Lunch')
  const ids = body.map((food) => food.id)
  assert.ok(ids.includes('1'))
  assert.ok(ids.includes('2'))
})

test('?_page=1&_limit=5 paginates and sets X-Total-Count', async () => {
  const { res, body } = await getJson('/api/foods?_page=1&_limit=5')
  assert.equal(res.status, 200)
  assert.equal(body.length, 5)
  assert.equal(res.headers.get('x-total-count'), '10')
})
