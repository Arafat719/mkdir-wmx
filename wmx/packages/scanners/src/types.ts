export interface ScanResult {
  framework: FrameworkInfo;
  dependencies: DependencyInfo;
  env: EnvInfo;
  git: GitInfo;
  scannedAt: string;
  projectRoot: string;
}

export interface FrameworkInfo {
  name: string | null;
  version: string | null;
  confidence: "high" | "medium" | "low";
  detectedBy: string;
}

export interface DependencyInfo {
  total: number;
  production: number;
  development: number;
  hasPnpm: boolean;
  hasYarn: boolean;
  hasNpm: boolean;
  packageManager: "pnpm" | "yarn" | "npm" | "unknown";
  outdatedCount: number;
}

export interface EnvInfo {
  hasEnvFile: boolean;
  hasEnvExample: boolean;
  hasEnvLocal: boolean;
  envVarCount: number;
  envFileNames: string[];
}

export interface GitInfo {
  isGitRepo: boolean;
  hasRemote: boolean;
  remoteUrl: string | null;
  branch: string | null;
  isDirty: boolean;
  commitCount: number;
}
