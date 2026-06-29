import chalk from "chalk";

export class Logger {
  info(message: string): void {
    console.log(`${chalk.blue("[i]")} ${message}`);
  }

  success(message: string): void {
    console.log(`${chalk.green("[ok]")} ${message}`);
  }

  warn(message: string): void {
    console.warn(`${chalk.yellow("[!]")} ${message}`);
  }

  error(message: string): void {
    console.error(`${chalk.red("[x]")} ${message}`);
  }

  debug(message: string): void {
    console.log(`${chalk.gray("[...]")} ${message}`);
  }
}

export const logger = new Logger();
