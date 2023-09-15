import {
  Receiver,
  SignatureError,
  __async,
  __spreadProps,
  __spreadValues
} from "./chunk-G4FL5XMG.mjs";

// src/client/error.ts
var QstashError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "QstashError";
  }
};

// src/client/http.ts
var HttpClient = class {
  constructor(config) {
    var _a, _b, _c;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.authorization = config.authorization;
    if (typeof (config == null ? void 0 : config.retry) === "boolean" && (config == null ? void 0 : config.retry) === false) {
      this.retry = {
        attempts: 1,
        backoff: () => 0
      };
    } else {
      this.retry = {
        attempts: ((_a = config.retry) == null ? void 0 : _a.retries) ? config.retry.retries + 1 : 5,
        backoff: (_c = (_b = config.retry) == null ? void 0 : _b.backoff) != null ? _c : (retryCount) => Math.exp(retryCount) * 50
      };
    }
  }
  request(req) {
    return __async(this, null, function* () {
      var _a;
      const headers = new Headers(req.headers);
      headers.set("Authorization", this.authorization);
      const requestOptions = {
        method: req.method,
        headers,
        body: req.body,
        keepalive: req.keepalive
      };
      const url = new URL([this.baseUrl, ...(_a = req.path) != null ? _a : []].join("/"));
      if (req.query) {
        for (const [key, value] of Object.entries(req.query)) {
          if (typeof value !== "undefined") {
            url.searchParams.set(key, value.toString());
          }
        }
      }
      let res = null;
      let error = null;
      for (let i = 0; i < this.retry.attempts; i++) {
        try {
          res = yield fetch(url.toString(), requestOptions);
          break;
        } catch (err) {
          error = err;
          yield new Promise((r) => setTimeout(r, this.retry.backoff(i)));
        }
      }
      if (!res) {
        throw error != null ? error : new Error("Exhausted all retries");
      }
      if (res.status < 200 || res.status >= 300) {
        const body = yield res.text();
        throw new QstashError(body.length > 0 ? body : `Error: status=${res.status}`);
      }
      if (req.parseResponseAsJson === false) {
        return void 0;
      } else {
        return yield res.json();
      }
    });
  }
};

// src/client/topics.ts
var Topics = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Create a new topic with the given name and endpoints
   */
  addEndpoints(req) {
    return __async(this, null, function* () {
      return yield this.http.request({
        method: "POST",
        path: ["v2", "topics", req.name],
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoints: req.endpoints })
      });
    });
  }
  /**
   * Remove endpoints from a topic.
   */
  removeEndpoints(req) {
    return __async(this, null, function* () {
      return yield this.http.request({
        method: "DELETE",
        path: ["v2", "topics", req.name],
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoints: req.endpoints })
      });
    });
  }
  /**
   * Get a list of all topics.
   */
  list() {
    return __async(this, null, function* () {
      return yield this.http.request({
        method: "GET",
        path: ["v2", "topics"]
      });
    });
  }
  /**
   * Get a single topic
   */
  get(name) {
    return __async(this, null, function* () {
      return yield this.http.request({
        method: "GET",
        path: ["v2", "topics", name]
      });
    });
  }
  /**
   * Delete a topic
   */
  delete(name) {
    return __async(this, null, function* () {
      return yield this.http.request({
        method: "DELETE",
        path: ["v2", "topics", name]
      });
    });
  }
};

// src/client/messages.ts
var Messages = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Get a message
   */
  get(messageId) {
    return __async(this, null, function* () {
      return yield this.http.request({
        method: "GET",
        path: ["v2", "messages", messageId]
      });
    });
  }
  /**
   * Cancel a message
   */
  delete(messageId) {
    return __async(this, null, function* () {
      return yield this.http.request({
        method: "DELETE",
        path: ["v2", "messages", messageId]
      });
    });
  }
};

// src/client/schedules.ts
var Schedules = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Create a schedule
   */
  create(req) {
    return __async(this, null, function* () {
      const headers = new Headers(req.headers);
      const ignoredHeaders = /* @__PURE__ */ new Set([
        "content-type",
        "upstash-cron",
        "upstash-method",
        "upstash-delay",
        "upstash-retries",
        "upstash-callback"
      ]);
      const keysToBePrefixed = Array.from(headers.keys()).filter(
        (key) => !ignoredHeaders.has(key.toLowerCase()) && !key.toLowerCase().startsWith("upstash-forward-")
      );
      console.log(headers);
      for (const key of keysToBePrefixed) {
        const value = headers.get(key);
        if (value !== null) {
          headers.set(`Upstash-Forward-${key}`, value);
        }
      }
      console.log(headers);
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      headers.set("Upstash-Cron", req.cron);
      if (typeof req.method !== "undefined") {
        headers.set("Upstash-Method", req.method);
      }
      if (typeof req.delay !== "undefined") {
        headers.set("Upstash-Delay", `${req.delay.toFixed()}s`);
      }
      if (typeof req.retries !== "undefined") {
        headers.set("Upstash-Retries", req.retries.toFixed());
      }
      if (typeof req.callback !== "undefined") {
        headers.set("Upstash-Callback", req.callback);
      }
      return yield this.http.request({
        method: "POST",
        headers,
        path: ["v2", "schedules", req.destination],
        body: req.body
      });
    });
  }
  /**
   * Get a schedule
   */
  get(scheduleId) {
    return __async(this, null, function* () {
      return yield this.http.request({
        method: "GET",
        path: ["v2", "schedules", scheduleId]
      });
    });
  }
  /**
   * List your schedules
   */
  list() {
    return __async(this, null, function* () {
      return yield this.http.request({
        method: "GET",
        path: ["v2", "schedules"]
      });
    });
  }
  /**
   * Delete a schedule
   */
  delete(scheduleId) {
    return __async(this, null, function* () {
      return yield this.http.request({
        method: "DELETE",
        path: ["v2", "schedules", scheduleId]
      });
    });
  }
};

// src/client/dlq.ts
var DLQ = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * List messages in the dlq
   */
  listMessages(opts) {
    return __async(this, null, function* () {
      return yield this.http.request({
        method: "GET",
        path: ["v2", "dlq"],
        query: { cursor: opts == null ? void 0 : opts.cursor }
      });
    });
  }
  /**
   * Remove a message from the dlq using it's `dlqId`
   */
  delete(dlqMessageId) {
    return __async(this, null, function* () {
      return yield this.http.request({
        method: "DELETE",
        path: ["v2", "dlq", dlqMessageId],
        parseResponseAsJson: false
        // there is no response
      });
    });
  }
};

// src/client/client.ts
var Client = class {
  constructor(config) {
    this.http = new HttpClient({
      retry: config.retry,
      baseUrl: config.baseUrl ? config.baseUrl.replace(/\/$/, "") : "https://qstash.upstash.io",
      authorization: `Bearer ${config.token}`
    });
  }
  /**
   * Access the topic API.
   *
   * Create, read, update or delete topics.
   */
  get topics() {
    return new Topics(this.http);
  }
  /**
   * Access the dlq API.
   *
   * List or remove messages from the DLQ.
   */
  get dlq() {
    return new DLQ(this.http);
  }
  /**
   * Access the message API.
   *
   * Read or cancel messages.
   */
  get messages() {
    return new Messages(this.http);
  }
  /**
   * Access the schedule API.
   *
   * Create, read or delete schedules.
   */
  get schedules() {
    return new Schedules(this.http);
  }
  publish(req) {
    return __async(this, null, function* () {
      var _a, _b;
      const headers = new Headers(req.headers);
      headers.set("Upstash-Method", (_a = req.method) != null ? _a : "POST");
      if (typeof req.delay !== "undefined") {
        headers.set("Upstash-Delay", `${req.delay.toFixed()}s`);
      }
      if (typeof req.notBefore !== "undefined") {
        headers.set("Upstash-Not-Before", req.notBefore.toFixed());
      }
      if (typeof req.deduplicationId !== "undefined") {
        headers.set("Upstash-Deduplication-Id", req.deduplicationId);
      }
      if (typeof req.contentBasedDeduplication !== "undefined") {
        headers.set("Upstash-Content-Based-Deduplication", "true");
      }
      if (typeof req.retries !== "undefined") {
        headers.set("Upstash-Retries", req.retries.toFixed());
      }
      if (typeof req.callback !== "undefined") {
        headers.set("Upstash-Callback", req.callback);
      }
      const res = yield this.http.request({
        path: ["v2", "publish", (_b = req.url) != null ? _b : req.topic],
        body: req.body,
        headers,
        method: "POST"
      });
      return res;
    });
  }
  /**
   * publishJSON is a utility wrapper around `publish` that automatically serializes the body
   * and sets the `Content-Type` header to `application/json`.
   */
  publishJSON(req) {
    return __async(this, null, function* () {
      const headers = new Headers(req.headers);
      headers.set("Content-Type", "application/json");
      const res = yield this.publish(__spreadProps(__spreadValues({}, req), {
        headers,
        body: JSON.stringify(req.body)
      }));
      return res;
    });
  }
  /**
   * Retrieve your logs.
   *
   * The logs endpoint is paginated and returns only 100 logs at a time.
   * If you want to receive more logs, you can use the cursor to paginate.
   *
   * The cursor is a unix timestamp with millisecond precision
   *
   * @example
   * ```ts
   * let cursor = Date.now()
   * const logs: Log[] = []
   * while (cursor > 0) {
   *   const res = await qstash.logs({ cursor })
   *   logs.push(...res.logs)
   *   cursor = res.cursor ?? 0
   * }
   * ```
   */
  events(req) {
    return __async(this, null, function* () {
      const query = {};
      if ((req == null ? void 0 : req.cursor) && req.cursor > 0) {
        query.cursor = req.cursor;
      }
      const res = yield this.http.request({
        path: ["v2", "events"],
        method: "GET",
        query
      });
      return res;
    });
  }
};
export {
  Client,
  Messages,
  QstashError,
  Receiver,
  Schedules,
  SignatureError,
  Topics
};
//# sourceMappingURL=index.mjs.map