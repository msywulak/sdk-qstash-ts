var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __knownSymbol = (name, symbol) => {
  if (symbol = Symbol[name])
    return symbol;
  throw Error("Symbol." + name + " is not defined");
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
var __forAwait = (obj, it, method) => (it = obj[__knownSymbol("asyncIterator")]) ? it.call(obj) : (obj = obj[__knownSymbol("iterator")](), it = {}, method = (key, fn) => (fn = obj[key]) && (it[key] = (arg) => new Promise((yes, no, done) => (arg = fn.call(obj, arg), done = arg.done, Promise.resolve(arg.value).then((value) => yes({ value, done }), no)))), method("next"), method("return"), it);

// src/receiver.ts
import * as jose from "jose";
import * as crypto from "crypto-js";
var SignatureError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "SignatureError";
  }
};
var Receiver = class {
  constructor(config) {
    this.currentSigningKey = config.currentSigningKey;
    this.nextSigningKey = config.nextSigningKey;
  }
  /**
   * Verify the signature of a request.
   *
   * Tries to verify the signature with the current signing key.
   * If that fails, maybe because you have rotated the keys recently, it will
   * try to verify the signature with the next signing key.
   *
   * If that fails, the signature is invalid and a `SignatureError` is thrown.
   */
  verify(req) {
    return __async(this, null, function* () {
      const isValid = yield this.verifyWithKey(this.currentSigningKey, req);
      if (isValid) {
        return true;
      }
      return this.verifyWithKey(this.nextSigningKey, req);
    });
  }
  /**
   * Verify signature with a specific signing key
   */
  verifyWithKey(key, req) {
    return __async(this, null, function* () {
      const jwt = yield jose.jwtVerify(req.signature, new TextEncoder().encode(key), {
        issuer: "Upstash",
        clockTolerance: req.clockTolerance
      }).catch((e) => {
        throw new SignatureError(e.message);
      });
      const p = jwt.payload;
      if (typeof req.url !== "undefined" && p.sub !== req.url) {
        throw new SignatureError(`invalid subject: ${p.sub}, want: ${req.url}`);
      }
      const bodyHash = crypto.SHA256(req.body).toString(crypto.enc.Base64url);
      const padding = new RegExp(/=+$/);
      if (p.body.replace(padding, "") !== bodyHash.replace(padding, "")) {
        throw new SignatureError(`body hash does not match, want: ${p.body}, got: ${bodyHash}`);
      }
      return true;
    });
  }
};

export {
  __spreadValues,
  __spreadProps,
  __async,
  __forAwait,
  SignatureError,
  Receiver
};
//# sourceMappingURL=chunk-G4FL5XMG.mjs.map