#!/usr/bin/env node
import { Command } from "commander";

import { register as registerInit } from "./commands/init.js";
import { register as registerDoctor } from "./commands/doctor.js";
import { register as registerCheck } from "./commands/check.js";
import { register as registerAnalyze } from "./commands/analyze.js";
import { register as registerDocs } from "./commands/docs.js";
import { register as registerDeps } from "./commands/deps.js";
import { register as registerStats } from "./commands/stats.js";
import { register as registerDeploy } from "./commands/deploy.js";
import { register as registerUpgrade } from "./commands/upgrade.js";
import { register as registerSnapshot } from "./commands/snapshot.js";
import { register as registerEnv } from "./commands/env.js";
import { register as registerPublish } from "./commands/publish.js";
import { register as registerInfo } from "./commands/info.js";
import { register as registerConfig } from "./commands/config.js";
import { register as registerTree } from "./commands/tree.js";
import { register as registerRoute } from "./commands/route.js";
import { register as registerApi } from "./commands/api.js";
import { register as registerUnused } from "./commands/unused.js";
import { register as registerSize } from "./commands/size.js";

const program = new Command();

program
  .name("wmx")
  .version("0.1.0")
  .description("WebMarketX Developer OS");

registerInit(program);
registerDoctor(program);
registerCheck(program);
registerAnalyze(program);
registerDocs(program);
registerDeps(program);
registerStats(program);
registerDeploy(program);
registerUpgrade(program);
registerSnapshot(program);
registerEnv(program);
registerPublish(program);
registerInfo(program);
registerConfig(program);
registerTree(program);
registerRoute(program);
registerApi(program);
registerUnused(program);
registerSize(program);

;(async () => {
  if (process.argv.length <= 2) {
    const { startTUI } = await import('./tui/index.js')
    startTUI()
  } else {
    program.parse(process.argv)
  }
})()
