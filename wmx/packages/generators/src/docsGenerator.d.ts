import type { AnalysisResult, RouteEntry } from 'wmx-os-scanners';
export declare function generateAnalysis(result: AnalysisResult, outputDir: string): Promise<void>;
export declare function generateReadme(cwd: string): Promise<string>;
export declare function generateArchitectureDocs(analysis: AnalysisResult): string;
export declare function generateApiDocs(routes: RouteEntry[]): string;
