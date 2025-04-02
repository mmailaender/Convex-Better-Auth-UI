class RefillingTokenBucket {
  max;
  refillIntervalSeconds;
  storage = /* @__PURE__ */ new Map();
  /**
   * @param {number} max - The maximum number of tokens in the bucket.
   * @param {number} refillIntervalSeconds - The interval (in seconds) at which tokens are refilled.
   */
  constructor(max, refillIntervalSeconds) {
    this.max = max;
    this.refillIntervalSeconds = refillIntervalSeconds;
  }
  /**
   * Checks if the bucket has enough tokens for the specified cost.
   *
   * @param {_Key} key - The key identifying the bucket.
   * @param {number} cost - The number of tokens required.
   * @returns {boolean} True if the bucket has enough tokens, false otherwise.
   */
  check(key, cost) {
    const bucket = this.storage.get(key) ?? null;
    if (bucket === null) {
      return true;
    }
    const now = Date.now();
    const refill = Math.floor((now - bucket.refilledAt) / (this.refillIntervalSeconds * 1e3));
    if (refill > 0) {
      return Math.min(bucket.count + refill, this.max) >= cost;
    }
    return bucket.count >= cost;
  }
  /**
   * Consumes tokens from the bucket for the specified cost.
   *
   * @param {_Key} key - The key identifying the bucket.
   * @param {number} cost - The number of tokens to consume.
   * @returns {boolean} True if the tokens were successfully consumed, false otherwise.
   */
  consume(key, cost) {
    let bucket = this.storage.get(key) ?? null;
    const now = Date.now();
    if (bucket === null) {
      bucket = {
        count: this.max - cost,
        refilledAt: now
      };
      this.storage.set(key, bucket);
      return true;
    }
    const refill = Math.floor((now - bucket.refilledAt) / (this.refillIntervalSeconds * 1e3));
    if (refill > 0) {
      bucket.count = Math.min(bucket.count + refill, this.max);
      bucket.refilledAt = now;
    }
    if (bucket.count < cost) {
      this.storage.set(key, bucket);
      return false;
    }
    bucket.count -= cost;
    this.storage.set(key, bucket);
    return true;
  }
}
export {
  RefillingTokenBucket as R
};
