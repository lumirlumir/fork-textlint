// MIT © 2017 azu
// MIT © 2017 59naga
// https://github.com/59naga/carrack
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var Bluebird = require("bluebird");
var PromiseEventEmitter = /** @class */ (function () {
    function PromiseEventEmitter() {
        this.events = new events_1.EventEmitter();
        this.events.setMaxListeners(0);
    }
    PromiseEventEmitter.prototype.listenerCount = function (type) {
        return this.events.listenerCount(type);
    };
    PromiseEventEmitter.prototype.on = function (event, listener) {
        return this.events.on(event, listener);
    };
    PromiseEventEmitter.prototype.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var promises = [];
        this.events.listeners(event).forEach(function (listener) {
            promises.push(listener.apply(void 0, args));
        });
        return Bluebird.all(promises);
    };
    return PromiseEventEmitter;
}());
exports.PromiseEventEmitter = PromiseEventEmitter;