const assert = require('node:assert/strict');
const clone = value => structuredClone(value);
class CollectionDouble {
  constructor() { this.docs = new Map(); this.writes = 0; this.beforeUpdate = null; }
  path(doc, key) { return key.split('.').reduce((value, part) => value?.[part], doc); }
  matches(doc, filter) {
    return doc && Object.entries(filter).every(([key, expected]) => {
      const actual = this.path(doc, key);
      if (expected && !(expected instanceof Date) && typeof expected === 'object') {
        return Object.entries(expected).every(([op, limit]) => {
          if (op === '$gt') return actual > limit;
          if (op === '$lte') return actual <= limit;
          throw new Error(`Unsupported test operator ${op}`);
        });
      }
      return actual instanceof Date && expected instanceof Date
        ? actual.getTime() === expected.getTime() : actual === expected;
    });
  }
  assign(doc, key, value) {
    const parts = key.split('.');
    const last = parts.pop();
    let target = doc;
    for (const part of parts) target = target[part] ||= {};
    target[last] = clone(value);
  }
  async insertOne(doc) {
    if (this.docs.has(doc._id)) throw new Error('Duplicate session');
    this.docs.set(doc._id, clone(doc)); this.writes++;
  }
  async findOne(filter) {
    const doc = this.docs.get(filter._id);
    return this.matches(doc, filter) ? clone(doc) : null;
  }
  async updateOne(filter, update, options) {
    if (options?.upsert) assert.deepEqual(Object.keys(update.$set), ['vento.revokedAt']);
    if (this.beforeUpdate) {
      const hook = this.beforeUpdate; this.beforeUpdate = null; await hook();
    }
    let doc = this.docs.get(filter._id);
    if (!doc && options?.upsert) {
      doc = { _id: filter._id };
      this.docs.set(filter._id, doc);
    }
    if (!this.matches(doc, filter)) return { matchedCount: 0 };
    for (const [key, value] of Object.entries(update.$set)) this.assign(doc, key, value);
    for (const [key, value] of Object.entries(update.$max || {})) {
      if (this.path(doc, key) === undefined || this.path(doc, key) < value) this.assign(doc, key, value);
    }
    this.writes++;
    return { matchedCount: 1 };
  }
  async findOneAndUpdate(filter, pipeline, options) {
    assert.equal(options.returnDocument, 'after');
    assert.equal(options.includeResultMetadata, false);
    assert.equal(options.upsert, undefined);
    assert.equal(filter['vento.revokedAt'], null);
    if (this.beforeUpdate) {
      const hook = this.beforeUpdate; this.beforeUpdate = null; await hook();
    }
    const doc = this.docs.get(filter._id);
    if (!this.matches(doc, filter)) return null;
    const set = pipeline[0].$set;
    assert.deepEqual(Object.keys(set).sort(),
      ['expires', 'session.cookie.expires', 'vento.lastActivityAt']);
    assert.equal(set.expires.$min[1], '$vento.absoluteExpiresAt');
    const expires = new Date(Math.min(set.expires.$min[0], doc.vento.absoluteExpiresAt));
    this.assign(doc, 'vento.lastActivityAt', set['vento.lastActivityAt']);
    this.assign(doc, 'expires', expires);
    this.assign(doc, 'session.cookie.expires', expires);
    this.writes++;
    return clone(doc);
  }
}

module.exports = CollectionDouble;
