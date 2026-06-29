import { join } from "path";
import { readJson } from "../utils/readJson.js";
import type { FrameworkInfo } from "../types.js";

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const FRAMEWORK_PRIORITY: Array<[string, string]> = [
  ["next", "next"],
  ["nuxt", "nuxt"],
  ["remix", "remix"],
  ["@sveltejs/kit", "sveltekit"],
  ["gatsby", "gatsby"],
  ["astro", "astro"],
  ["express", "express"],
  ["fastify", "fastify"],
  ["koa", "koa"],
  ["@nestjs/core", "nestjs"],
  ["vue", "vue"],
  ["svelte", "svelte"],
  ["react", "react"],
];

export class FrameworkScanner {
  constructor(private projectRoot: string) {}

  async scan(): Promise<FrameworkInfo> {
    const pkg = await readJson<PackageJson>(join(this.projectRoot, "package.json"));

    if (!pkg) {
      return { name: null, version: null, confidence: "low", detectedBy: "none" };
    }

    const deps = pkg.dependencies ?? {};
    const devDeps = pkg.devDependencies ?? {};

    // Special case: react-vite (vite + react both present)
    const hasVite = "vite" in deps || "vite" in devDeps;
    const hasReact = "react" in deps || "react" in devDeps;
    if (hasVite && hasReact) {
      const inProd = "vite" in deps && "react" in deps;
      return {
        name: "react-vite",
        version: deps["react"] ?? devDeps["react"] ?? null,
        confidence: inProd ? "high" : "medium",
        detectedBy: inProd ? "package.json#dependencies" : "package.json#devDependencies",
      };
    }

    for (const [key, frameworkName] of FRAMEWORK_PRIORITY) {
      if (key in deps) {
        return {
          name: frameworkName,
          version: deps[key] ?? null,
          confidence: "high",
          detectedBy: "package.json#dependencies",
        };
      }
      if (key in devDeps) {
        return {
          name: frameworkName,
          version: devDeps[key] ?? null,
          confidence: "medium",
          detectedBy: "package.json#devDependencies",
        };
      }
    }

    return { name: null, version: null, confidence: "low", detectedBy: "none" };
  }
}
