export interface ProjectIssue {
    type: 'error' | 'warn' | 'info';
    code: string;
    message: string;
    fix?: string;
}
export declare function scanProject(cwd: string): Promise<ProjectIssue[]>;
