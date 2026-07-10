import assert from 'node:assert/strict'
import { isRetryablePortCollision } from './lib/port-collision.mjs'

const ansiPortTimeout
  = '\u001B[31mGetPortError:\u001B[0m Timeout waiting for port 51666 after 20 retries'

assert.equal(isRetryablePortCollision(ansiPortTimeout), true)
assert.equal(isRetryablePortCollision('listen EADDRINUSE: address already in use 127.0.0.1:53257'), true)
assert.equal(isRetryablePortCollision('GetPortError without a port timeout'), false)
assert.equal(isRetryablePortCollision('AssertionError: expected 500 to be 200'), false)

console.log('Vitest retry classification is valid, including ANSI-coloured port errors.')
