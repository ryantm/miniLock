// Basic arithmetic test.
QUnit.test('basic', function(assert) {
	'use strict';
	assert.ok((1 + 1) === 2, 'Addition')
	assert.ok((64 - 32) === 32, 'Substraction')
	assert.ok((64 / 2) === 32, 'Division')
	assert.ok((64 % 10) === 4, 'Modulo')
	assert.ok((32 * 2) === 64, 'Multiplication')
	assert.ok(Math.pow(2, 6) === 64, 'Math.pow()')
	assert.deepEqual(0 ^ 1, 1, 'XOR')
	assert.deepEqual(1 & 1, 1, 'AND')
	assert.deepEqual(1 | 1, 1, 'OR')
	assert.deepEqual(32 << 16, 2097152, 'Shift left')
	assert.deepEqual(16 >> 2, 4, 'Shift right')
	assert.deepEqual(4096 >>> 5000, 16, 'Zerofill right shift')
})