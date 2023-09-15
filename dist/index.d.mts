/**
 * Necessary to verify the signature of a request.
 */
type ReceiverConfig = {
    /**
     * The current signing key. Get it from `https://console.upstash.com/qstash
     */
    currentSigningKey: string;
    /**
     * The next signing key. Get it from `https://console.upstash.com/qstash
     */
    nextSigningKey: string;
};
type VerifyRequest = {
    /**
     * The signature from the `upstash-signature` header.
     */
    signature: string;
    /**
     * The raw request body.
     */
    body: string;
    /**
     * URL of the endpoint where the request was sent to.
     *
     * Omit empty to disable checking the url.
     */
    url?: string;
    /**
     * Number of seconds to tolerate when checking `nbf` and `exp` claims, to deal with small clock differences among different servers
     *
     * @default 0
     */
    clockTolerance?: number;
};
declare class SignatureError extends Error {
    constructor(message: string);
}
/**
 * Receiver offers a simlpe way to verify the signature of a request.
 */
declare class Receiver {
    private readonly currentSigningKey;
    private readonly nextSigningKey;
    constructor(config: ReceiverConfig);
    /**
     * Verify the signature of a request.
     *
     * Tries to verify the signature with the current signing key.
     * If that fails, maybe because you have rotated the keys recently, it will
     * try to verify the signature with the next signing key.
     *
     * If that fails, the signature is invalid and a `SignatureError` is thrown.
     */
    verify(req: VerifyRequest): Promise<boolean>;
    /**
     * Verify signature with a specific signing key
     */
    private verifyWithKey;
}

type UpstashRequest = {
    /**
     * The path to the resource.
     */
    path: string[];
    /**
     * A BodyInit object or null to set request's body.
     */
    body?: BodyInit | null;
    /**
     * A Headers object, an object literal, or an array of two-item arrays to set
     * request's headers.
     */
    headers?: HeadersInit;
    /**
     * A boolean to set request's keepalive.
     */
    keepalive?: boolean;
    /**
     * A string to set request's method.
     */
    method?: "GET" | "POST" | "PUT" | "DELETE";
    query?: Record<string, string | number | boolean | undefined>;
    /**
     * if enabled, call `res.json()`
     *
     * @default true
     */
    parseResponseAsJson?: boolean;
};
type UpstashResponse<TResult> = TResult & {
    error?: string;
};
interface Requester {
    request: <TResult = unknown>(req: UpstashRequest) => Promise<UpstashResponse<TResult>>;
}
type RetryConfig = false | {
    /**
     * The number of retries to attempt before giving up.
     *
     * @default 5
     */
    retries?: number;
    /**
     * A backoff function receives the current retry cound and returns a number in milliseconds to wait before retrying.
     *
     * @default
     * ```ts
     * Math.exp(retryCount) * 50
     * ```
     */
    backoff?: (retryCount: number) => number;
};

type Endpoint = {
    /**
     * The name of the endpoint (optional)
     */
    name?: string;
    /**
     * The url of the endpoint
     */
    url: string;
};
type AddEndpointsRequest = {
    /**
     * The name of the topic.
     * Must be unique and only contain alphanumeric, hyphen, underscore and periods.
     */
    name: string;
    endpoints: Endpoint[];
};
type RemoveEndpointsRequest = {
    /**
     * The name of the topic.
     * Must be unique and only contain alphanumeric, hyphen, underscore and periods.
     */
    name: string;
    endpoints: ({
        name: string;
        url?: string;
    } | {
        name?: string;
        url: string;
    })[];
};
type Topic = {
    /**
     * The name of this topic.
     */
    name: string;
    /**
     * A list of all subscribed endpoints
     */
    endpoints: Endpoint[];
};
declare class Topics {
    private readonly http;
    constructor(http: Requester);
    /**
     * Create a new topic with the given name and endpoints
     */
    addEndpoints(req: AddEndpointsRequest): Promise<Topic>;
    /**
     * Remove endpoints from a topic.
     */
    removeEndpoints(req: RemoveEndpointsRequest): Promise<Topic>;
    /**
     * Get a list of all topics.
     */
    list(): Promise<Topic[]>;
    /**
     * Get a single topic
     */
    get(name: string): Promise<Topic>;
    /**
     * Delete a topic
     */
    delete(name: string): Promise<void>;
}

type Message = {
    /**
     * A unique identifier for this message.
     */
    messageId: string;
    /**
     * The topic name if this message was sent to a topic.
     */
    topicName?: string;
    /**
     * The url where this message is sent to.
     */
    url: string;
    /**
     * The http method used to deliver the message
     */
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    /**
     * The http headers sent along with the message to your API.
     */
    header?: Record<string, string[]>;
    /**
     * The http body sent to your API
     */
    body?: string;
    /**
     * Maxmimum number of retries.
     */
    maxRetries?: number;
    /**
     * A unix timestamp (milliseconds) after which this message may get delivered.
     */
    notBefore?: number;
    /**
     * A unix timestamp (milliseconds) when this messages was crated.
     */
    createdAt: number;
    /**
     * The callback url if configured.
     */
    callback?: string;
};
declare class Messages {
    private readonly http;
    constructor(http: Requester);
    /**
     * Get a message
     */
    get(messageId: string): Promise<Message>;
    /**
     * Cancel a message
     */
    delete(messageId: string): Promise<void>;
}

type Schedule = {
    scheduleId: string;
    cron: string;
    createdAt: number;
    destination: string;
    method: string;
    header?: Record<string, string[]>;
    body?: string;
    retries: number;
    delay?: number;
    callback?: string;
};
type CreateScheduleRequest = {
    /**
     * Either a URL or topic name
     */
    destination: string;
    /**
     * The message to send.
     *
     * This can be anything, but please set the `Content-Type` header accordingly.
     *
     * You can leave this empty if you want to send a message with no body.
     */
    body?: BodyInit;
    /**
     * Optionally send along headers with the message.
     * These headers will be sent to your destination.
     *
     * We highly recommend sending a `Content-Type` header along, as this will help your destination
     * server to understand the content of the message.
     */
    headers?: HeadersInit;
    /**
     * Optionally delay the delivery of this message.
     *
     * In seconds.
     *
     * @default undefined
     */
    delay?: number;
    /**
     * In case your destination server is unavaialble or returns a status code outside of the 200-299
     * range, we will retry the request after a certain amount of time.
     *
     * Configure how many times you would like the delivery to be retried
     *
     * @default The maximum retry quota associated with your account.
     */
    retries?: number;
    /**
     * Use a callback url to forward the response of your destination server to your callback url.
     *
     * The callback url must be publicly accessible
     *
     * @default undefined
     */
    callback?: string;
    /**
     * The method to use when sending a request to your API
     *
     * @default `POST`
     */
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    /**
     * Specify a cron expression to repeatedly send this message to the destination.
     */
    cron: string;
};
declare class Schedules {
    private readonly http;
    constructor(http: Requester);
    /**
     * Create a schedule
     */
    create(req: CreateScheduleRequest): Promise<{
        scheduleId: string;
    }>;
    /**
     * Get a schedule
     */
    get(scheduleId: string): Promise<Schedule>;
    /**
     * List your schedules
     */
    list(): Promise<Schedule[]>;
    /**
     * Delete a schedule
     */
    delete(scheduleId: string): Promise<void>;
}

type State = "CREATED" | "ACTIVE" | "DELIVERED" | "ERROR" | "RETRY" | "FAILED";
type Event = {
    time: number;
    state: State;
    messageId: string;
    nextDeliveryTime?: number;
    error?: string;
    url: string;
    topicName?: string;
    endpointName?: string;
};
type WithCursor<T> = T & {
    cursor?: number;
};

type DlqMessage = Message & {
    dlqId: string;
};
declare class DLQ {
    private readonly http;
    constructor(http: Requester);
    /**
     * List messages in the dlq
     */
    listMessages(opts?: {
        cursor?: string;
    }): Promise<{
        messages: DlqMessage[];
        cursor?: string;
    }>;
    /**
     * Remove a message from the dlq using it's `dlqId`
     */
    delete(dlqMessageId: string): Promise<void>;
}

type ClientConfig = {
    /**
     * Url of the qstash api server.
     *
     * This is only used for testing.
     *
     * @default "https://qstash.upstash.io"
     */
    baseUrl?: string;
    /**
     * The authorization token from the upstash console.
     */
    token: string;
    /**
     * Configure how the client should retry requests.
     */
    retry?: RetryConfig;
};
type PublishRequest<TBody = BodyInit> = {
    /**
     * The message to send.
     *
     * This can be anything, but please set the `Content-Type` header accordingly.
     *
     * You can leave this empty if you want to send a message with no body.
     */
    body?: TBody;
    /**
     * Optionally send along headers with the message.
     * These headers will be sent to your destination.
     *
     * We highly recommend sending a `Content-Type` header along, as this will help your destination
     * server to understand the content of the message.
     */
    headers?: HeadersInit;
    /**
     * Optionally delay the delivery of this message.
     *
     * In seconds.
     *
     * @default undefined
     */
    delay?: number;
    /**
     * Optionally set the absolute delay of this message.
     * This will override the delay option.
     * The message will not delivered until the specified time.
     *
     * Unix timestamp in seconds.
     *
     * @default undefined
     */
    notBefore?: number;
    /**
     * Provide a unique id for deduplication. This id will be used to detect duplicate messages.
     * If a duplicate message is detected, the request will be accepted but not enqueued.
     *
     * We store deduplication ids for 90 days. Afterwards it is possible that the message with the
     * same deduplication id is delivered again.
     *
     * When scheduling a message, the deduplication happens before the schedule is created.
     *
     * @default undefined
     */
    deduplicationId?: string;
    /**
     * If true, the message content will get hashed and used as deduplication id.
     * If a duplicate message is detected, the request will be accepted but not enqueued.
     *
     * The content based hash includes the following values:
     *    - All headers, except Upstash-Authorization, this includes all headers you are sending.
     *    - The entire raw request body The destination from the url path
     *
     * We store deduplication ids for 90 days. Afterwards it is possible that the message with the
     * same deduplication id is delivered again.
     *
     * When scheduling a message, the deduplication happens before the schedule is created.
     *
     * @default false
     */
    contentBasedDeduplication?: boolean;
    /**
     * In case your destination server is unavaialble or returns a status code outside of the 200-299
     * range, we will retry the request after a certain amount of time.
     *
     * Configure how many times you would like the delivery to be retried
     *
     * @default The maximum retry quota associated with your account.
     */
    retries?: number;
    /**
     * Use a callback url to forward the response of your destination server to your callback url.
     *
     * The callback url must be publicly accessible
     *
     * @default undefined
     */
    callback?: string;
    /**
     * The method to use when sending a request to your API
     *
     * @default `POST`
     */
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
} & ({
    /**
     * The url where the message should be sent to.
     */
    url: string;
    topic?: never;
} | {
    url?: never;
    /**
     * The url where the message should be sent to.
     */
    topic: string;
});
type PublishJsonRequest = Omit<PublishRequest, "body"> & {
    /**
     * The message to send.
     * This can be anything as long as it can be serialized to JSON.
     */
    body: unknown;
};
type EventsRequest = {
    cursor?: number;
};
type GetEventsResponse = {
    cursor?: number;
    events: Event[];
};
declare class Client {
    http: Requester;
    constructor(config: ClientConfig);
    /**
     * Access the topic API.
     *
     * Create, read, update or delete topics.
     */
    get topics(): Topics;
    /**
     * Access the dlq API.
     *
     * List or remove messages from the DLQ.
     */
    get dlq(): DLQ;
    /**
     * Access the message API.
     *
     * Read or cancel messages.
     */
    get messages(): Messages;
    /**
     * Access the schedule API.
     *
     * Create, read or delete schedules.
     */
    get schedules(): Schedules;
    publish<TRequest extends PublishRequest>(req: TRequest): Promise<PublishResponse<TRequest>>;
    /**
     * publishJSON is a utility wrapper around `publish` that automatically serializes the body
     * and sets the `Content-Type` header to `application/json`.
     */
    publishJSON<TBody = unknown, TRequest extends PublishRequest<TBody> = PublishRequest<TBody>>(req: TRequest): Promise<PublishResponse<TRequest>>;
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
    events(req?: EventsRequest): Promise<GetEventsResponse>;
}
type PublishToUrlResponse = {
    messageId: string;
    url: string;
    deduplicated?: boolean;
};
type PublishToTopicResponse = PublishToUrlResponse[];
type PublishResponse<R> = R extends {
    url: string;
} ? PublishToUrlResponse : PublishToTopicResponse;

/**
 * Result of 500 Internal Server Error
 */
declare class QstashError extends Error {
    constructor(message: string);
}

export { AddEndpointsRequest, Client, CreateScheduleRequest, Endpoint, Event, EventsRequest, GetEventsResponse, Message, Messages, PublishJsonRequest, PublishRequest, QstashError, Receiver, ReceiverConfig, RemoveEndpointsRequest, Schedule, Schedules, SignatureError, State, Topic, Topics, VerifyRequest, WithCursor };
