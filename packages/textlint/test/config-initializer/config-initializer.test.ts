// LICENSE : MIT
"use strict";
import { createConfigFile } from "../../src/config/config-initializer.js";
import { afterEach, beforeEach, describe, it } from "vitest";
import { Logger } from "../../src/util/logger.js";
import path from "node:path";
import os from "node:os";
import sh from "shelljs";
import assert from "node:assert";
import fs from "node:fs";

describe("config-initializer-test", function () {
    let configDir: string;
    const originErrorLog = Logger.error;

    beforeEach(function () {
        // Create unique directory for each test to avoid conflicts
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        configDir = `${os.tmpdir()}/textlint-config-${timestamp}-${random}`;
        sh.mkdir("-p", configDir);
    });

    afterEach(function () {
        if (fs.existsSync(configDir)) {
            sh.rm("-rf", configDir);
        }
    });
    describe("when package.json has textlint-rule-* packages", function () {
        beforeEach(function () {
            // Ensure directory exists and is accessible
            if (!fs.existsSync(configDir)) {
                sh.mkdir("-p", configDir);
            }
            const packageFilePath = path.resolve(process.cwd(), "test/config-initializer/fixtures/package.json");
            sh.cp(packageFilePath, configDir);
        });
        it("should create new file with packages", function () {
            return createConfigFile({
                dir: configDir,
                verbose: false
            }).then(function (exitStatus) {
                assert.strictEqual(exitStatus, 0);
                const config = JSON.parse(fs.readFileSync(path.join(configDir, ".textlintrc.json"), "utf-8"));
                assert.equal(typeof config.filters, "object");
                assert.equal(typeof config.rules, "object");
                assert.equal(typeof config.plugins, "object");
                assert.deepEqual(config.filters, { comments: true });
                assert.deepEqual(config.rules, { eslint: true, prh: true, "preset-ja-technical-writing": true });
                assert.deepEqual(config.plugins, { html: true });
            });
        });
    });
    describe("when .textlintrc is not existed", function () {
        it("should create new file", function () {
            return createConfigFile({
                dir: configDir,
                verbose: false
            }).then(function (exitStatus) {
                assert.strictEqual(exitStatus, 0);
                const config = JSON.parse(fs.readFileSync(path.join(configDir, ".textlintrc.json"), "utf-8"));
                assert.strictEqual(typeof config.filters, "object");
                assert.strictEqual(typeof config.rules, "object");
                assert.strictEqual(typeof config.plugins, "object");
                assert.ok(Object.keys(config.rules).length === 0);
            });
        });
        it("should create and show message if verbose:true", function () {
            Logger.log = function mockErrorLog(...message: unknown[]) {
                const logMessage = message.join(' ');
                assert.ok(/\.textlintrc.json is created/.test(logMessage), "should show created message");
            };
            return createConfigFile({
                dir: configDir,
                verbose: true
            }).then(function (exitStatus) {
                assert.equal(exitStatus, 0);
            });
        });
    });
    describe("when .textlintrc is existed", function () {
        beforeEach(function () {
            // mock console API
            Logger.error = function mockErrorLog() {};
        });

        afterEach(function () {
            Logger.error = originErrorLog;
        });

        it("should be an error", function () {
            Logger.error = function mockErrorLog(message) {
                assert.equal(message, ".textlintrc.json is already existed.");
            };
            return createConfigFile({
                dir: configDir,
                verbose: false
            })
                .then((exitStatus) => {
                    assert.equal(exitStatus, 0);
                    // try to re-create
                    return createConfigFile({
                        dir: configDir,
                        verbose: false
                    });
                })
                .then((exitStatus) => {
                    assert.equal(exitStatus, 1);
                });
        });
    });
});
