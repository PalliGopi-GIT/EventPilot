const assert = require("assert");

class SimpleRateLimiter {
  constructor() {
    this.store = new Map();
  }

  limit(key, maxLimit = 3, windowMs = 1000) {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + windowMs });
      return { success: true, remaining: maxLimit - 1 };
    }

    if (record.count >= maxLimit) {
      return { success: false, remaining: 0 };
    }

    record.count += 1;
    return { success: true, remaining: maxLimit - record.count };
  }
}

console.log("Running Rate Limiter Test Suite...");

const limiter = new SimpleRateLimiter();
const key = "user_test_123";

assert.strictEqual(limiter.limit(key, 2, 1000).success, true, "1st request allowed");
assert.strictEqual(limiter.limit(key, 2, 1000).success, true, "2nd request allowed");
assert.strictEqual(limiter.limit(key, 2, 1000).success, false, "3rd request rejected (limit 2)");

console.log("✓ Rate limiting correctly rejected requests over limit.\n");
