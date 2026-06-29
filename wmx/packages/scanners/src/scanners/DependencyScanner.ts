import { join } from "path";
import { readJson } from "../utils/readJson.js";
import { fileExists } from "../utils/fileExists.js";
import type { DependencyInfo } from "../types.js";

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export class DependencyScanner {
  constructor(private projectRoot: string) {}

  async scan(): Promise<DependencyInfo> {
    const pkg = await readJson<PackageJson>(join(this.projectRoot, "package.json"));

    const production = Object.keys(pkg?.dependencies ?? {}).length;
    const development = Object.keys(pkg?.devDependencies ?? {}).length;
    const total = production + development;

    const hasPnpm = await fileExists(join(this.projectRoot, "pnpm-lock.yaml"));
    const hasYarn = await fileExists(join(this.projectRoot, "yarn.lock"));
    const hasNpm = await fileExists(join(this.projectRoot, "package-lock.json"));

    let packageManager: DependencyInfo["packageManager"] = "unknown";
    if (hasPnpm) packageManager = "pnpm";
    else if (hasYarn) packageManager = "yarn";
    else if (hasNpm) packageManager = "npm";

    return {
      total,
      production,
      development,
      hasPnpm,
      hasYarn,
      hasNpm,
      packageManager,
      outdatedCount: 0,
    };
  }
}
