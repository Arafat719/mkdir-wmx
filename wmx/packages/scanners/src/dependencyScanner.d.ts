export interface HeavyDep {
    name: string;
    reason: string;
    alternative: string;
}
export interface OutdatedDep {
    name: string;
    current: string;
    latest: string;
    type: 'prod' | 'dev';
}
export interface DependencyReport {
    unused: string[];
    missing: string[];
    heavy: HeavyDep[];
    outdated: OutdatedDep[];
}
export declare function scanDependencies(cwd: string): Promise<DependencyReport>;
