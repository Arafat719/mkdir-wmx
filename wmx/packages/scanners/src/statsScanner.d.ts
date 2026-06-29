export interface ProjectStats {
    totalFiles: number;
    totalLines: number;
    sourceFiles: number;
    sourceLines: number;
    components: number;
    pages: number;
    routes: number;
    apiEndpoints: number;
    assets: {
        images: number;
        fonts: number;
        svgs: number;
    };
    dependencies: {
        total: number;
        dev: number;
        prod: number;
    };
    largestFile: {
        path: string;
        lines: number;
    };
    fileTypes: {
        ts: number;
        tsx: number;
        js: number;
        jsx: number;
        css: number;
        other: number;
    };
}
export declare function scanStats(cwd: string): Promise<ProjectStats>;
