import chalk from "chalk";
export class Logger {
    info(message) {
        console.log(`${chalk.blue("[i]")} ${message}`);
    }
    success(message) {
        console.log(`${chalk.green("[ok]")} ${message}`);
    }
    warn(message) {
        console.warn(`${chalk.yellow("[!]")} ${message}`);
    }
    error(message) {
        console.error(`${chalk.red("[x]")} ${message}`);
    }
    debug(message) {
        console.log(`${chalk.gray("[...]")} ${message}`);
    }
}
export const logger = new Logger();
