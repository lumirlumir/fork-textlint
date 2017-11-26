// LICENSE : MIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MessageProcessManager = /** @class */ (function () {
    /**
     * Preprossor
     */
    function MessageProcessManager(preProcessors) {
        this._preProcessors = preProcessors || [];
        this._processors = [];
    }
    MessageProcessManager.prototype.add = function (messageProcessor) {
        this._processors.push(messageProcessor);
    };
    MessageProcessManager.prototype.remove = function (process) {
        var index = this._processors.indexOf(process);
        if (index !== -1) {
            this._processors.splice(index, 1);
        }
    };
    /**
     * process `messages` with registered processes
     * @param {TextlintMessage[]} messages
     * @returns {TextlintMessage[]}
     */
    MessageProcessManager.prototype.process = function (messages) {
        var originalMessages = messages;
        if (this._preProcessors.length === 0) {
            throw new Error("pre process should be > 0");
        }
        var preProcessedMesssages = this._preProcessors.reduce(function (messages, filter) {
            return filter(messages);
        }, originalMessages);
        if (this._processors.length === 0) {
            return preProcessedMesssages;
        }
        return this._processors.reduce(function (messages, filter) {
            return filter(messages);
        }, preProcessedMesssages);
    };
    return MessageProcessManager;
}());
exports.default = MessageProcessManager;