"use strict";Object.defineProperty(exports, "__esModule", {value: true});



var _chunkEQTYEU4Ujs = require('./chunk-EQTYEU4U.js');

// src/nextjs.ts
var _server = require('next/server');
function verifySignature(handler, config) {
  var _a, _b;
  const currentSigningKey = (_a = config == null ? void 0 : config.currentSigningKey) != null ? _a : process.env.QSTASH_CURRENT_SIGNING_KEY;
  if (!currentSigningKey) {
    throw new Error(
      "currentSigningKey is required, either in the config or as env variable QSTASH_CURRENT_SIGNING_KEY"
    );
  }
  const nextSigningKey = (_b = config == null ? void 0 : config.nextSigningKey) != null ? _b : process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!nextSigningKey) {
    throw new Error(
      "nextSigningKey is required, either in the config or as env variable QSTASH_NEXT_SIGNING_KEY"
    );
  }
  const receiver = new (0, _chunkEQTYEU4Ujs.Receiver)({
    currentSigningKey,
    nextSigningKey
  });
  return (req, res) => _chunkEQTYEU4Ujs.__async.call(void 0, this, null, function* () {
    const signature = req.headers["upstash-signature"];
    if (!signature) {
      res.status(400);
      res.send("`Upstash-Signature` header is missing");
      res.end();
      return;
    }
    if (typeof signature !== "string") {
      throw new Error("`Upstash-Signature` header is not a string");
    }
    const chunks = [];
    try {
      for (var iter = _chunkEQTYEU4Ujs.__forAwait.call(void 0, req), more, temp, error; more = !(temp = yield iter.next()).done; more = false) {
        const chunk = temp.value;
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
    } catch (temp) {
      error = [temp];
    } finally {
      try {
        more && (temp = iter.return) && (yield temp.call(iter));
      } finally {
        if (error)
          throw error[0];
      }
    }
    const body = Buffer.concat(chunks).toString("utf-8");
    const isValid = yield receiver.verify({
      signature,
      body,
      clockTolerance: config == null ? void 0 : config.clockTolerance
    });
    if (!isValid) {
      res.status(400);
      res.send("Invalid signature");
      res.end();
      return;
    }
    try {
      if (req.headers["content-type"] === "application/json") {
        req.body = JSON.parse(body);
      } else {
        req.body = body;
      }
    } catch (e) {
      req.body = body;
    }
    return handler(req, res);
  });
}
function verifySignatureEdge(handler, config) {
  var _a, _b;
  const currentSigningKey = (_a = config == null ? void 0 : config.currentSigningKey) != null ? _a : process.env.QSTASH_CURRENT_SIGNING_KEY;
  if (!currentSigningKey) {
    throw new Error(
      "currentSigningKey is required, either in the config or as env variable QSTASH_CURRENT_SIGNING_KEY"
    );
  }
  const nextSigningKey = (_b = config == null ? void 0 : config.nextSigningKey) != null ? _b : process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!nextSigningKey) {
    throw new Error(
      "nextSigningKey is required, either in the config or as env variable QSTASH_NEXT_SIGNING_KEY"
    );
  }
  const receiver = new (0, _chunkEQTYEU4Ujs.Receiver)({
    currentSigningKey,
    nextSigningKey
  });
  return (req, nfe) => _chunkEQTYEU4Ujs.__async.call(void 0, this, null, function* () {
    const reqClone = req.clone();
    const signature = req.headers.get("upstash-signature");
    if (!signature) {
      return new (0, _server.NextResponse)(new TextEncoder().encode("`Upstash-Signature` header is missing"), {
        status: 403
      });
    }
    if (typeof signature !== "string") {
      throw new Error("`Upstash-Signature` header is not a string");
    }
    const body = yield req.text();
    const isValid = yield receiver.verify({
      signature,
      body,
      clockTolerance: config == null ? void 0 : config.clockTolerance
    });
    if (!isValid) {
      return new (0, _server.NextResponse)(new TextEncoder().encode("invalid signature"), { status: 403 });
    }
    let parsedBody = void 0;
    try {
      if (req.headers.get("content-type") === "application/json") {
        parsedBody = JSON.parse(body);
      } else {
        parsedBody = body;
      }
    } catch (e) {
      parsedBody = body;
    }
    return handler(reqClone, nfe);
  });
}



exports.verifySignature = verifySignature; exports.verifySignatureEdge = verifySignatureEdge;
//# sourceMappingURL=nextjs.js.map