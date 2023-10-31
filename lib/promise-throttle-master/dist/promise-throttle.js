"use strict";

class promiseThrottle {
  constructor(options) {
    this.requestsPerSecond = options.requestsPerSecond;
    this.promiseImplementation = options.promiseImplementation || Promise;
    this.lastStartTime = 0;
    this.queued = [];
    this.executeCounter = 0;
  }

  add(promise, options) {
    const opt = options || {};
    return new this.promiseImplementation((resolve, reject) => {
      this.queued.push({
        resolve: resolve,
        reject: reject,
        promise: promise,
        weight: opt.weight || 1,
        signal: opt.signal,
      });

      this.dequeue();
    });
  }

  addAll(promises, options) {
    const addedPromises = promises.map((promise) => {
      return this.add(promise, options);
    });

    return Promise.all(addedPromises);
  }

  dequeue() {
    if (this.queued.length > 0) {
      const now = new Date(),
        weight = this.queued[0].weight,
        inc = (1000 / this.requestsPerSecond) * weight,
        elapsed = now - this.lastStartTime;

      if (elapsed >= inc) {
        this._execute();
      } else {
        setTimeout(() => {
          this.dequeue();
        }, inc - elapsed);
      }
    }
  }

  _execute() {
    this.lastStartTime = new Date();
    const candidate = this.queued.shift();
    const aborted = candidate.signal && candidate.signal.aborted;
    this.executeCounter++; // Increment the counter

    if (aborted) {
      candidate.reject(new DOMException("", "AbortError"));
    } else {
      candidate
        .promise()
        .then((r) => {
          candidate.resolve(r);
        })
        .catch((r) => {
          candidate.reject(r);
        });
    }

    // Log every 50th promise execution (or any other number you find suitable)
    if (this.executeCounter % 50 === 0) {
      console.log(`Executed ${this.executeCounter} promises.`);
    }
  }
}

window.promiseThrottleInstance = new promiseThrottle({
  requestsPerSecond: 50,
});
