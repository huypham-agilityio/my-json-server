const { test } = require('node:test')
const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const path = require('node:path')

const ROOT = path.join(__dirname, '..')
const READY = /JSON Server is running on port (\d+)/

function startServer(env) {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, ['server.js'], { cwd: ROOT, env })
        let output = ''

        const timer = setTimeout(() => {
            cleanup()
            child.kill()
            reject(new Error(`Server did not start within 5s. Output:\n${output}`))
        }, 5000)

        function onData(chunk) {
            output += chunk
            const match = output.match(READY)
            if (match) {
                cleanup()
                resolve({ child, port: Number(match[1]) })
            }
        }

        function onExit(code) {
            cleanup()
            reject(new Error(`Server exited early with code ${code}. Output:\n${output}`))
        }

        function cleanup() {
            clearTimeout(timer)
            child.stdout.off('data', onData)
            child.stderr.off('data', onData)
            child.off('exit', onExit)
        }

        child.stdout.setEncoding('utf8')
        child.stderr.setEncoding('utf8')
        child.stdout.on('data', onData)
        child.stderr.on('data', onData)
        child.on('exit', onExit)
    })
}

function stopServer(child) {
    if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve()
    return new Promise((resolve) => {
        child.once('exit', resolve)
        child.kill()
    })
}

function envWithout(name) {
    const env = { ...process.env }
    delete env[name]
    return env
}

test('listens on PORT when it is set', async (t) => {
    const { child, port } = await startServer({ ...process.env, PORT: '4123' })
    t.after(() => stopServer(child))

    const res = await fetch('http://127.0.0.1:4123/foods')
    assert.strictEqual(res.status, 200)
    assert.strictEqual(port, 4124)
})

test('falls back to 3000 when PORT is not set', async (t) => {
    const { child, port } = await startServer(envWithout('PORT'))
    t.after(() => stopServer(child))

    assert.strictEqual(port, 3000)
    const res = await fetch('http://127.0.0.1:3000/foods')
    assert.strictEqual(res.status, 200)
})

test('falls back to 3000 when PORT is empty', async (t) => {
    const { child, port } = await startServer({ ...process.env, PORT: '' })
    t.after(() => stopServer(child))

    assert.strictEqual(port, 3000)
    const res = await fetch('http://127.0.0.1:3000/foods')
    assert.strictEqual(res.status, 200)
})
