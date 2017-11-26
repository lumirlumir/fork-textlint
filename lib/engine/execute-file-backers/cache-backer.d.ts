import { AbstractBacker } from "./abstruct-backer";
import { Config } from "../../config/config";
import { TextlintTypes } from "@textlint/kernel";
export declare class CacheBacker implements AbstractBacker {
    hashOfConfig: string;
    fileCache: any;
    isEnabled: boolean;
    /**
     * @param {Config} config
     */
    constructor(config: Config);
    /**
     * @param {string} filePath
     * @returns {boolean}
     */
    shouldExecute({filePath}: {
        filePath: string;
    }): any;
    /**
     * @param {TextlintResult} result
     */
    didExecute({result}: {
        result: TextlintTypes.TextlintResult;
    }): void;
    /**
     * destroy all cache
     */
    destroyCache(): void;
    afterAll(): void;
}