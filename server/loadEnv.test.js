import { test } from 'node:test'
import assert from 'node:assert/strict'
import { writeFileSync, rmSync } from 'node:fs'
import { loadEnv } from './loadEnv.js'

test('loadEnv loads KEY=VALUE lines without overwriting existing vars', () => {
  const path = '/tmp/kort-test.env'
  writeFileSync(path, 'FOO_KORT=hello\n# a comment\nBAR_KORT=world\nPRESET_KORT=fromfile\n')
  process.env.PRESET_KORT = 'preexisting'
  loadEnv(path)
  assert.equal(process.env.FOO_KORT, 'hello')
  assert.equal(process.env.BAR_KORT, 'world')
  assert.equal(process.env.PRESET_KORT, 'preexisting') // not overwritten
  rmSync(path)
  delete process.env.FOO_KORT
  delete process.env.BAR_KORT
  delete process.env.PRESET_KORT
})

test('loadEnv silently does nothing when the file is missing', () => {
  assert.doesNotThrow(() => loadEnv('/tmp/kort-does-not-exist.env'))
})
