export interface RouteEntry {
    method: string;
    path: string;
    file: string;
    line: number;
}
export interface ImportEntry {
    from: string;
    to: string;
}
export interface ExportEntry {
    name: string;
    file: string;
    type: 'function' | 'class' | 'const' | 'type';
}
export interface AnalysisResult {
    folderTree: string;
    routes: RouteEntry[];
    imports: ImportEntry[];
    exports: ExportEntry[];
}
export declare function analyzeProject(cwd: string): Promise<AnalysisResult>;
