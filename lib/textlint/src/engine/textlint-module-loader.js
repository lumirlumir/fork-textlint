// LICENSE : MIT
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var interopRequire = require("interop-require");
var debug = require("debug")("textlint:module-loader");
var isFile = require("is-file");
var config_util_1 = require("../util/config-util");
var rule_loader_1 = require("./rule-loader");
var logger_1 = require("../util/logger");
var textlint_module_resolver_1 = require("./textlint-module-resolver");
var textlint_module_mapper_1 = require("./textlint-module-mapper");
var TextLintModuleLoader = /** @class */ (function (_super) {
    __extends(TextLintModuleLoader, _super);
    function TextLintModuleLoader(config) {
        var _this = _super.call(this) || this;
        /**
         * @type {Config} config is need for static prefix value
         */
        _this.config = config;
        /**
         * @type {TextLintModuleResolver}
         */
        _this.moduleResolver = new textlint_module_resolver_1.TextLintModuleResolver(_this.config.constructor, _this.config.rulesBaseDirectory);
        return _this;
    }
    Object.defineProperty(TextLintModuleLoader, "Event", {
        get: function () {
            return {
                rule: "rule",
                filterRule: "filterRule",
                plugin: "plugin",
                error: "error"
            };
        },
        enumerable: true,
        configurable: true
    });
    /**
     * set up lint rules using {@lint Config} object.
     * The {@lint Config} object was created with initialized {@link TextLintEngine} (as-known Constructor).
     * @param {Config} config the config is parsed object
     */
    TextLintModuleLoader.prototype.loadFromConfig = function (config) {
        var _this = this;
        debug("config %O", config);
        // --ruledir
        if (config.rulePaths) {
            // load in additional rules
            config.rulePaths.forEach(function (rulesDir) {
                debug("Loading rules from %o", rulesDir);
                var rules = rule_loader_1.loadFromDir(rulesDir);
                Object.keys(rules).forEach(function (ruleName) {
                    var entry = [ruleName, rules[ruleName]];
                    _this.emit(TextLintModuleLoader.Event.rule, entry);
                });
            });
        }
        // --rule
        if (config.rules) {
            // load in additional rules
            config.rules.forEach(function (ruleName) {
                _this.loadRule(ruleName);
            });
        }
        // TODO: --filter
        if (config.filterRules) {
            // load in additional filterRules
            config.filterRules.forEach(function (ruleName) {
                _this.loadFilterRule(ruleName);
            });
        }
        // --preset
        if (config.presets) {
            config.presets.forEach(function (presetName) {
                _this.loadPreset(presetName);
            });
        }
        // --plugin
        if (config.plugins) {
            // load in additional rules from plugin
            config.plugins.forEach(function (pluginName) {
                _this.loadPlugin(pluginName);
            });
        }
    };
    /**
     * load rule from plugin name.
     * plugin module has `rules` object and define rule with plugin prefix.
     * @param {string} pluginName
     */
    TextLintModuleLoader.prototype.loadPlugin = function (pluginName) {
        var pkgPath = this.moduleResolver.resolvePluginPackageName(pluginName);
        debug("Loading rules from plugin: %s", pkgPath);
        var plugin = interopRequire(pkgPath);
        var PLUGIN_NAME_PREFIX = this.config.constructor.PLUGIN_NAME_PREFIX;
        var prefixMatch = new RegExp("^" + PLUGIN_NAME_PREFIX);
        var pluginNameWithoutPrefix = pluginName.replace(prefixMatch, "");
        // Notes: plugins not support "rules" and "rulesConfig"
        // https://github.com/textlint/textlint/issues/291
        if (plugin.hasOwnProperty("rules")) {
            throw new Error("textlint plugins not support \"rules\" and \"rulesConfig\".\nBut " + pluginName + " has these filed.\nFor more details, See https://github.com/textlint/textlint/issues/291");
        }
        // register plugin.Processor
        if (!plugin.hasOwnProperty("Processor")) {
            throw new Error("textlint plugin should have \"Processor\".\nFor more details. See https://github.com/textlint/textlint/blob/master/docs/plugin.md");
        }
        var pluginEntry = [pluginNameWithoutPrefix, plugin];
        this.emit(TextLintModuleLoader.Event.plugin, pluginEntry);
    };
    TextLintModuleLoader.prototype.loadPreset = function (presetName) {
        var _this = this;
        /*
         Caution: Rules of preset are defined as following.
             {
                "rules": {
                    "preset-gizmo": {
                        "ruleA": false

                }
            }

        It mean that "ruleA" is defined as "preset-gizmo/ruleA"

         */
        var RULE_NAME_PREFIX = this.config.constructor.RULE_NAME_PREFIX;
        // Strip **rule** prefix
        // textlint-rule-preset-gizmo -> preset-gizmo
        var prefixMatch = new RegExp("^" + RULE_NAME_PREFIX);
        var presetRuleNameWithoutPrefix = presetName.replace(prefixMatch, "");
        // ignore plugin's rule
        if (config_util_1.isPluginRuleKey(presetRuleNameWithoutPrefix)) {
            logger_1.Logger.warn(presetRuleNameWithoutPrefix + " is Plugin's rule. This is unknown case, please report issue.");
            return;
        }
        var pkgPath = this.moduleResolver.resolvePresetPackageName(presetName);
        debug("Loading rules from preset: %s", pkgPath);
        var preset = interopRequire(pkgPath);
        var entities = textlint_module_mapper_1.TextLintModuleMapper.createEntities(preset.rules, presetRuleNameWithoutPrefix);
        entities.forEach(function (entry) {
            _this.emit(TextLintModuleLoader.Event.rule, entry);
        });
    };
    /**
     * load rule file with `ruleName` and define rule.
     * if rule is not found, then throw ReferenceError.
     * if already rule is loaded, do not anything.
     * @param {string} ruleName
     */
    TextLintModuleLoader.prototype.loadRule = function (ruleName) {
        /*
           Task
             - check already define
             - resolve package name
             - load package
             - emit rule
        */
        // ruleName is filePath
        if (isFile(ruleName)) {
            var ruleCreator_1 = interopRequire(ruleName);
            var ruleEntry_1 = [ruleName, ruleCreator_1];
            this.emit(TextLintModuleLoader.Event.rule, ruleEntry_1);
            return;
        }
        // ignore already defined rule
        // ignore rules from rulePaths because avoid ReferenceError is that try to require.
        var RULE_NAME_PREFIX = this.config.constructor.RULE_NAME_PREFIX;
        var prefixMatch = new RegExp("^" + RULE_NAME_PREFIX);
        var definedRuleName = ruleName.replace(prefixMatch, "");
        // ignore plugin's rule
        if (config_util_1.isPluginRuleKey(definedRuleName)) {
            logger_1.Logger.warn(definedRuleName + " is Plugin's rule. This is unknown case, please report issue.");
            return;
        }
        var pkgPath = this.moduleResolver.resolveRulePackageName(ruleName);
        debug("Loading rules from %s", pkgPath);
        var ruleCreator = interopRequire(pkgPath);
        var ruleEntry = [definedRuleName, ruleCreator];
        this.emit(TextLintModuleLoader.Event.rule, ruleEntry);
    };
    /**
     * load filter rule file with `ruleName` and define rule.
     * if rule is not found, then throw ReferenceError.
     * if already rule is loaded, do not anything.
     * @param {string} ruleName
     */
    TextLintModuleLoader.prototype.loadFilterRule = function (ruleName) {
        /*
           Task
             - check already define
             - resolve package name
             - load package
             - emit rule
        */
        // ignore already defined rule
        // ignore rules from rulePaths because avoid ReferenceError is that try to require.
        if (isFile(ruleName)) {
            var ruleCreator_2 = interopRequire(ruleName);
            var ruleEntry_2 = [ruleName, ruleCreator_2];
            this.emit(TextLintModuleLoader.Event.filterRule, ruleEntry_2);
            return;
        }
        var RULE_NAME_PREFIX = this.config.constructor.FILTER_RULE_NAME_PREFIX;
        var prefixMatch = new RegExp("^" + RULE_NAME_PREFIX);
        var definedRuleName = ruleName.replace(prefixMatch, "");
        // ignore plugin's rule
        if (config_util_1.isPluginRuleKey(definedRuleName)) {
            logger_1.Logger.warn(definedRuleName + " is Plugin's rule. This is unknown case, please report issue.");
            return;
        }
        var pkgPath = this.moduleResolver.resolveFilterRulePackageName(ruleName);
        debug("Loading filter rules from %s", pkgPath);
        var ruleCreator = interopRequire(pkgPath);
        var ruleEntry = [definedRuleName, ruleCreator];
        this.emit(TextLintModuleLoader.Event.filterRule, ruleEntry);
    };
    return TextLintModuleLoader;
}(events_1.EventEmitter));
exports.TextLintModuleLoader = TextLintModuleLoader;