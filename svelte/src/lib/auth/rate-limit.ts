/**
 * A token bucket that refills tokens at a fixed interval.
 *
 * @template _Key The type of the key used to identify buckets.
 */
export class RefillingTokenBucket<_Key> {
	public max: number;
	public refillIntervalSeconds: number;
	private storage = new Map<_Key, RefillBucket>();

	/**
	 * @param {number} max - The maximum number of tokens in the bucket.
	 * @param {number} refillIntervalSeconds - The interval (in seconds) at which tokens are refilled.
	 */
	constructor(max: number, refillIntervalSeconds: number) {
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
	public check(key: _Key, cost: number): boolean {
		const bucket = this.storage.get(key) ?? null;
		if (bucket === null) {
			return true;
		}
		const now = Date.now();
		const refill = Math.floor((now - bucket.refilledAt) / (this.refillIntervalSeconds * 1000));
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
	public consume(key: _Key, cost: number): boolean {
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
		const refill = Math.floor((now - bucket.refilledAt) / (this.refillIntervalSeconds * 1000));
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

/**
 * A throttler that limits actions based on a timeout schedule.
 *
 * @template _Key The type of the key used to identify throttling counters.
 */
export class Throttler<_Key> {
	public timeoutSeconds: number[];
	private storage = new Map<_Key, ThrottlingCounter>();

	/**
	 * @param {number[]} timeoutSeconds - An array of timeout durations (in seconds) for each throttling level.
	 */
	constructor(timeoutSeconds: number[]) {
		this.timeoutSeconds = timeoutSeconds;
	}

	/**
	 * Consumes a throttling allowance for the specified key.
	 *
	 * @param {_Key} key - The key identifying the throttling counter.
	 * @returns {boolean} True if the action is allowed, false otherwise.
	 */
	public consume(key: _Key): boolean {
		let counter = this.storage.get(key) ?? null;
		const now = Date.now();
		if (counter === null) {
			counter = {
				timeout: 0,
				updatedAt: now
			};
			this.storage.set(key, counter);
			return true;
		}
		const allowed = now - counter.updatedAt >= this.timeoutSeconds[counter.timeout] * 1000;
		if (!allowed) {
			return false;
		}
		counter.updatedAt = now;
		counter.timeout = Math.min(counter.timeout + 1, this.timeoutSeconds.length - 1);
		this.storage.set(key, counter);
		return true;
	}

	/**
	 * Resets the throttling counter for the specified key.
	 *
	 * @param {_Key} key - The key identifying the throttling counter.
	 */
	public reset(key: _Key): void {
		this.storage.delete(key);
	}
}

/**
 * A token bucket with an expiration time.
 *
 * @template _Key The type of the key used to identify buckets.
 */
export class ExpiringTokenBucket<_Key> {
	public max: number;
	public expiresInSeconds: number;
	private storage = new Map<_Key, ExpiringBucket>();

	/**
	 * @param {number} max - The maximum number of tokens in the bucket.
	 * @param {number} expiresInSeconds - The expiration time for the bucket (in seconds).
	 */
	constructor(max: number, expiresInSeconds: number) {
		this.max = max;
		this.expiresInSeconds = expiresInSeconds;
	}

	/**
	 * Checks if the bucket has enough tokens for the specified cost.
	 *
	 * @param {_Key} key - The key identifying the bucket.
	 * @param {number} cost - The number of tokens required.
	 * @returns {boolean} True if the bucket has enough tokens, false otherwise.
	 */
	public check(key: _Key, cost: number): boolean {
		const bucket = this.storage.get(key) ?? null;
		const now = Date.now();
		if (bucket === null) {
			return true;
		}
		if (now - bucket.createdAt >= this.expiresInSeconds * 1000) {
			return true;
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
	public consume(key: _Key, cost: number): boolean {
		let bucket = this.storage.get(key) ?? null;
		const now = Date.now();
		if (bucket === null) {
			bucket = {
				count: this.max - cost,
				createdAt: now
			};
			this.storage.set(key, bucket);
			return true;
		}
		if (now - bucket.createdAt >= this.expiresInSeconds * 1000) {
			bucket.count = this.max;
		}
		if (bucket.count < cost) {
			return false;
		}
		bucket.count -= cost;
		this.storage.set(key, bucket);
		return true;
	}

	/**
	 * Resets the bucket for the specified key.
	 *
	 * @param {_Key} key - The key identifying the bucket.
	 */
	public reset(key: _Key): void {
		this.storage.delete(key);
	}
}

interface RefillBucket {
	count: number;
	refilledAt: number;
}

interface ExpiringBucket {
	count: number;
	createdAt: number;
}

interface ThrottlingCounter {
	timeout: number;
	updatedAt: number;
}
