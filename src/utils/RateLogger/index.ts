// RateLogger: allows 5 requests, then enforces a 60s cooldown before the next batch.
class RateLogger {
	batchSize: number;
	cooldownMs: number;
	countInBatch: number;
	batchEndTime: number;

	constructor({ batchSize = 5, cooldownMs = 60_000 } = {}) {
		this.batchSize = batchSize;
		this.cooldownMs = cooldownMs;
		this.countInBatch = 0; // how many requests in the current batch
		this.batchEndTime = 0; // when the last batch was completed
	}

	/**
	 * Try to log a request.
	 * @returns {{allowed: boolean, reason: 'ok'|'cooldown', retryAfterMs: number}}
	 */
	log() {
		const now = Date.now();

		// Check if we're still in cooldown period after completing a batch
		if (this.countInBatch === 0 && this.batchEndTime > 0) {
			const cooldownEndsAt = this.batchEndTime + this.cooldownMs;
			if (now < cooldownEndsAt) {
				return {
					allowed: false,
					reason: 'cooldown',
					retryAfterMs: cooldownEndsAt - now,
				};
			}
		}

		// Accept this request
		this.countInBatch += 1;

		// If we just completed a batch, record the time and reset counter
		if (this.countInBatch >= this.batchSize) {
			this.batchEndTime = now;
			this.countInBatch = 0;
		}

		return { allowed: true, reason: 'ok', retryAfterMs: 0 };
	}

	// Optional: method to check status without logging
	canLog() {
		const now = Date.now();
		if (this.countInBatch === 0 && this.batchEndTime > 0) {
			const cooldownEndsAt = this.batchEndTime + this.cooldownMs;
			if (now < cooldownEndsAt) {
				return {
					allowed: false,
					reason: 'cooldown',
					retryAfterMs: cooldownEndsAt - now,
				};
			}
		}
		return { allowed: true, reason: 'ok', retryAfterMs: 0 };
	}
}

/* ---------------- Example usage ---------------- */
const rl = new RateLogger({ batchSize: 5, cooldownMs: 60_000 });

console.log('=== Testing Rate Logger ===');

// Simulate 7 requests quickly
for (let i = 1; i <= 7; i++) {
	const res = rl.log();
	console.log(
		`Request #${i}:`,
		res.allowed
			? 'ALLOWED'
			: `BLOCKED (cooldown, retry in ${Math.ceil(res.retryAfterMs / 1000)}s)`,
	);
}

console.log('\n=== Simulating time passage ===');
// Simulate waiting and then making more requests
setTimeout(() => {
	console.log('After 60+ seconds...');
	for (let i = 8; i <= 10; i++) {
		const res = rl.log();
		console.log(
			`Request #${i}:`,
			res.allowed
				? 'ALLOWED'
				: `BLOCKED (cooldown, retry in ${Math.ceil(res.retryAfterMs / 1000)}s)`,
		);
	}
}, 1000); // Simulate 1 second for demo (would be 60000 in real usage)

/* ---------------- Express middleware example ---------------- */
/*
const express = require('express');
const app = express();

// Per-process limiter (for per-user, use Map<userId, RateLogger>)
const globalRateLogger = new RateLogger({ batchSize: 5, cooldownMs: 60_000 });

app.use((req, res, next) => {
  const result = globalRateLogger.log();
  
  if (!result.allowed) {
    res.set('Retry-After', Math.ceil(result.retryAfterMs / 1000));
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please wait before making more requests.',
      retryAfterMs: result.retryAfterMs,
      retryAfterSeconds: Math.ceil(result.retryAfterMs / 1000)
    });
  }
  
  next();
});

app.get('/', (req, res) => {
  res.json({ message: 'Request successful', timestamp: new Date().toISOString() });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
*/

/* -------------- Notes --------------
Key improvements over original:
1. Uses batchEndTime instead of cooldownUntil for clearer semantics
2. Only starts cooldown after a complete batch is finished
3. Cooldown period is exactly 60s between batch completion and next batch start
4. Added canLog() method to check status without consuming a request slot
5. More descriptive variable names and better comments

Behavior:
- Requests 1-5: Allowed immediately
- Request 6+: Blocked for exactly 60s after request 5 completed
- After cooldown: Next batch of 5 requests allowed immediately
- Pattern repeats

For production use:
- Consider using Redis for distributed rate limiting
- Add per-user tracking with Map<userId, RateLogger>
- Consider sliding window vs fixed window approaches
- Add logging/monitoring for rate limit hits
*/
