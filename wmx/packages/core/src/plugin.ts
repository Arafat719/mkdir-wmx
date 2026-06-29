import type { WmxContext } from "./context.js";

export interface WmxCommand {
  name: string;
  description: string;
  options?: Record<string, string>;
  run(options: Record<string, unknown>, context: WmxContext): Promise<void>;
}

export interface WmxPlugin {
  name: string;
  version: string;
  commands?: WmxCommand[];
}
