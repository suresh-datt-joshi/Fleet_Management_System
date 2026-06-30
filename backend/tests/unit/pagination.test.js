import test from 'node:test';
import assert from 'node:assert/strict';
import { getPagination, buildPaginationMeta } from '../../utils/pagination.js';

test('getPagination applies defaults', () => {
  const result = getPagination({});
  assert.equal(result.page, 1);
  assert.equal(result.limit, 10);
  assert.equal(result.skip, 0);
});

test('getPagination respects page and limit', () => {
  const result = getPagination({ page: '3', limit: '20' });
  assert.equal(result.page, 3);
  assert.equal(result.limit, 20);
  assert.equal(result.skip, 40);
});

test('getPagination caps limit at 100', () => {
  const result = getPagination({ limit: '500' });
  assert.equal(result.limit, 100);
});

test('getPagination parses sort ascending', () => {
  const result = getPagination({ sort: 'name:asc' });
  assert.deepEqual(result.sort, { name: 1 });
});

test('buildPaginationMeta calculates pages correctly', () => {
  const meta = buildPaginationMeta(25, 2, 10);
  assert.equal(meta.total, 25);
  assert.equal(meta.totalPages, 3);
  assert.equal(meta.hasNextPage, true);
  assert.equal(meta.hasPrevPage, true);
});
