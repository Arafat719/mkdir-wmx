import path from "path";
import type { Command } from "commander";
import inquirer from "inquirer";
import ora from "ora";
import chalk from "chalk";
import { logger } from "wmx-os-core";
import { ScaffoldGenerator } from "wmx-os-generators";

interface InitAnswers {
  language: string;
  framework: string;
  backend: string;
  database: string;
  auth: string;
  packageManager: string;
}

export function register(program: Command): void {
  program
    .command("init")
    .description("Initialize a new project")
    .action(async () => {
      logger.info("Welcome to wmx init wizard");
      console.log("");

      const { useCurrentDir } = await inquirer.prompt<{ useCurrentDir: boolean }>([
        {
          type: "confirm",
          name: "useCurrentDir",
          message: "Use current directory?",
          default: false,
        },
      ]);

      let projectName: string;

      if (useCurrentDir) {
        projectName = path.basename(process.cwd());
      } else {
        const { name } = await inquirer.prompt<{ name: string }>([
          {
            type: "input",
            name: "name",
            message: "Project name?",
            default: "my-app",
            validate: (value: string) => {
              if (!value || value.trim() === "") return "Project name cannot be empty";
              if (/\s/.test(value)) return "Project name cannot contain spaces";
              return true;
            },
          },
        ]);
        projectName = name;
      }

      const answers = await inquirer.prompt<InitAnswers>([
        {
          type: "list",
          name: "language",
          message: "Language:",
          choices: ["TypeScript", "JavaScript"],
        },
        {
          type: "list",
          name: "framework",
          message: "Choose framework:",
          choices: ["React", "Next.js", "Vue"],
        },
        {
          type: "list",
          name: "backend",
          message: "Choose backend:",
          choices: ["Express", "NestJS", "None"],
        },
        {
          type: "list",
          name: "database",
          message: "Choose database:",
          choices: ["MongoDB", "PostgreSQL", "MySQL", "None"],
        },
        {
          type: "list",
          name: "auth",
          message: "Choose authentication:",
          choices: ["JWT", "None"],
        },
        {
          type: "list",
          name: "packageManager",
          message: "Choose package manager:",
          choices: ["npm", "pnpm", "bun"],
        },
      ]);

      console.log("");
      console.log(chalk.hex("#a855f7").bold("── Project Summary ──────────────"));
      console.log(`  ${chalk.white("Project name:")}    ${chalk.white.bold(projectName)}`);
      console.log(`  ${chalk.white("Location:")}        ${chalk.white.bold(useCurrentDir ? "current directory" : `./${projectName}`)}`);
      console.log(`  ${chalk.white("Language:")}        ${chalk.white.bold(answers.language)}`);
      console.log(`  ${chalk.white("Framework:")}       ${chalk.white.bold(answers.framework)}`);
      console.log(`  ${chalk.white("Backend:")}         ${chalk.white.bold(answers.backend)}`);
      console.log(`  ${chalk.white("Database:")}        ${chalk.white.bold(answers.database)}`);
      console.log(`  ${chalk.white("Auth:")}            ${chalk.white.bold(answers.auth)}`);
      console.log(`  ${chalk.white("Package manager:")} ${chalk.white.bold(answers.packageManager)}`);
      console.log(chalk.hex("#a855f7").bold("─────────────────────────────────"));
      console.log("");

      const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
        {
          type: "confirm",
          name: "confirm",
          message: "Confirm and create project?",
          default: true,
        },
      ]);

      if (!confirm) {
        logger.info("Cancelled");
        process.exit(0);
      }

      const spinner = ora("Creating project...").start();
      spinner.stop();

      try {
        await ScaffoldGenerator.generate({
          projectName,
          language: answers.language,
          framework: answers.framework,
          backend: answers.backend,
          database: answers.database,
          auth: answers.auth,
          packageManager: answers.packageManager,
          useCurrentDir,
        });

        spinner.stop();

        if (useCurrentDir) {
          logger.success(`Project created in current directory`);
          logger.info(`Next: ${answers.packageManager} install`);
        } else {
          logger.success(`Project created at ./${projectName}`);
          logger.info(`Next: cd ${projectName} && ${answers.packageManager} install`);
        }
      } catch (err) {
        spinner.fail("Project creation failed");
        logger.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });
}
