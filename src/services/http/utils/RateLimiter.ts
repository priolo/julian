export default class RateLimiter {
	private limit: number;       // Max allowed calls
	private windowMs: number;    // Time window in milliseconds
	private store: Map<string, number[]>; // ID → timestamps

	constructor(limit: number, windowMs: number) {
		this.limit = limit;
		this.windowMs = windowMs;
		this.store = new Map();
	}

	/**
	 * Removes keys whose last timestamp is older than windowMs.
	 */
	private cleanup(): void {
		const now = Date.now();

		for (const [id, timestamps] of this.store.entries()) {
			const last = timestamps[timestamps.length - 1];

			if (!last || now - last >= this.windowMs) {
				this.store.delete(id);
			}
		}
	}

	/**
	 * Checks whether the ID has exceeded the rate limit.
	 * @param id - The unique identifier (IP, user ID, token...)
	 * @returns boolean — true if limit exceeded, false if allowed
	 */
	public isLimited(id: string): boolean {
		const now = Date.now();

		// Auto-clean old keys
		this.cleanup();

		if (!this.store.has(id)) {
			this.store.set(id, []);
		}

		// Keep only timestamps within the window
		const timestamps = this.store
			.get(id)!
			.filter(ts => now - ts < this.windowMs);

		// Record current attempt
		timestamps.push(now);
		this.store.set(id, timestamps);

		// Check if the limit is exceeded
		return timestamps.length > this.limit;
	}
}
