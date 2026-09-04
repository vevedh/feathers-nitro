import type { Query } from '@feathersjs/feathers'
import assert from 'node:assert'
import { filterQuery } from '@feathersjs/adapter-commons'

describe('feathers query security regression', () => {
  it('rejects unknown operators hidden inside nested $or arrays', () => {
    const query = {
      $or: [[{ $where: '1==1' }]],
    } as unknown as Query

    assert.throws(
      () => filterQuery(query),
      /Invalid query parameter \$where/u,
    )
  })
})
