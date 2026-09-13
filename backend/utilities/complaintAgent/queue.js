/**
 * queue.js — Concurrency-limited job queue for complaint investigations.
 *
 * Prevents overwhelming the OpenRouter API when multiple complaints arrive
 * simultaneously. Processes max N investigations concurrently (default: 2).
 *
 * Features:
 * - FIFO queue with configurable concurrency
 * - Per-job retry with exponential backoff (max 3 attempts)
 * - Graceful shutdown
 */

const MAX_CONCURRENCY = 2;       // Max parallel agent runs
const MAX_RETRIES = 3;           // Retry failed jobs up to 3 times
const BASE_RETRY_DELAY_MS = 5000; // 5s base delay, doubles each retry

class ComplaintQueue {
  constructor(processFn, concurrency = MAX_CONCURRENCY) {
    this.processFn = processFn;
    this.concurrency = concurrency;
    this.queue = [];         // Pending jobs: { complaintId, attempt }
    this.running = 0;        // Currently executing count
    this.shutdown = false;
  }

  /**
   * Add a complaint to the investigation queue.
   * @param {string} complaintId
   */
  enqueue(complaintId) {
    if (this.shutdown) {
      console.warn('[Queue] Cannot enqueue — queue is shutting down.');
      return;
    }

    // Prevent duplicate entries for the same complaint
    const alreadyQueued = this.queue.some((j) => j.complaintId === complaintId);
    if (alreadyQueued) {
      console.log(`[Queue] Complaint ${complaintId} already in queue, skipping duplicate.`);
      return;
    }

    this.queue.push({ complaintId, attempt: 0 });
    console.log(`[Queue] Enqueued complaint ${complaintId}. Queue depth: ${this.queue.length}, Running: ${this.running}`);
    this._drain();
  }

  /**
   * Start processing jobs up to concurrency limit.
   */
  _drain() {
    while (!this.shutdown && this.running < this.concurrency && this.queue.length > 0) {
      const job = this.queue.shift();
      this.running++;
      this._execute(job);
    }
  }

  /**
   * Execute a single job with retry logic.
   */
  async _execute(job) {
    const { complaintId, attempt } = job;

    try {
      await this.processFn(complaintId);
      // Success — nothing more to do
    } catch (err) {
      const isRateLimit = err.message?.includes('429') || err.message?.includes('rate');
      const retryable = attempt < MAX_RETRIES - 1;

      if (retryable) {
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt) * (isRateLimit ? 3 : 1);
        console.warn(
          `[Queue] Attempt ${attempt + 1}/${MAX_RETRIES} failed for ${complaintId}: ${err.message}. ` +
          `Retrying in ${Math.round(delay / 1000)}s...`
        );
        setTimeout(() => {
          this.queue.push({ complaintId, attempt: attempt + 1 });
          this._drain();
        }, delay);
      } else {
        console.error(
          `[Queue] All ${MAX_RETRIES} attempts exhausted for ${complaintId}. ` +
          `Marking as failed — sweeper will pick it up later.`
        );
        // Mark complaint as needing manual intervention
        try {
          const { query } = await import('../../config/db.js');
          await query(
            `UPDATE complaints SET status = 'needs_human_review', ai_summary = $1 WHERE id = $2 AND status = 'pending'`,
            [`Agent investigation failed after ${MAX_RETRIES} attempts: ${err.message}`, complaintId]
          );
        } catch (dbErr) {
          console.error('[Queue] Failed to update complaint status after exhaustion:', dbErr.message);
        }
      }
    } finally {
      this.running--;
      this._drain();
    }
  }

  /**
   * Get queue stats.
   */
  stats() {
    return {
      queued: this.queue.length,
      running: this.running,
      concurrency: this.concurrency,
      shutdown: this.shutdown,
    };
  }

  /**
   * Graceful shutdown — stop accepting new jobs, let running ones finish.
   */
  async close() {
    this.shutdown = true;
    // Wait for running jobs to finish (max 60s)
    const start = Date.now();
    while (this.running > 0 && Date.now() - start < 60000) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

// ─── Singleton Instance ─────────────────────────────────────────
let instance = null;

/**
 * Initialize the queue with the processComplaint function.
 * Called once at server startup.
 */
export function initQueue(processFn) {
  if (instance) return instance;
  instance = new ComplaintQueue(processFn, MAX_CONCURRENCY);
  console.log(`[Queue] Complaint investigation queue initialized (max ${MAX_CONCURRENCY} concurrent).`);
  return instance;
}

/**
 * Get the queue singleton.
 */
export function getQueue() {
  if (!instance) throw new Error('[Queue] Queue not initialized. Call initQueue() first.');
  return instance;
}
