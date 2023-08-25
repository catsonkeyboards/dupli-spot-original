// Promise Throttle Requests per second setting used to regualte the amount of requests to the Spotify API

var promiseThrottle = new PromiseThrottle({
    requestsPerSecond: 50, // 50 requests per second
    promiseImplementation: Promise
  });
  