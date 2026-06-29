interface ScaffoldAnswers {
    projectName: string;
    framework: string;
    backend: string;
    database: string;
    packageManager: string;
    features?: string[];
    [key: string]: unknown;
}
export declare class ScaffoldGenerator {
    static generate(answers: ScaffoldAnswers): Promise<void>;
    private static resolveTemplate;
    private static replaceInAllFiles;
}
export {};
