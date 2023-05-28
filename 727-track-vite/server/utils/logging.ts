import { Timestamp } from "mongodb";
import terminalKit from "terminal-kit";
import { LogLevel } from "ts-loader/dist/logger.js";
import winston, {transports, format} from "winston";
const log = terminalKit.terminal;

const isProd = process.env.NODE_ENV === "production";

type logLevel = "INFO" | "SUCCESS" | "DEBUG" | "WARN" | "ERROR";
const prefix = "[727 track server]";


const logger = winston.createLogger({
  transports:[new transports.Console(), new transports.File({
    filename: "./log.txt",
  })],
});

/**
 * Log un message à la console ou dans un fichier texte
 * @param message Le message à afficher
 * @param logLevel Niveau de log. Change la couleur dans la console et si le texte est affiché en production.
 */
export function Log(message: any, logLevel: logLevel = "INFO") {
  if (!isProd) {
    switch (logLevel) {
      case "INFO":
        log.white(`${prefix} ${message}\n`);
        break;
      case "SUCCESS":
        log.green(`${prefix} ${message}\n`);
        break;
      case "DEBUG":
        log.blue(`${prefix} ${message}\n`);
        break;
      case "WARN":
        log.yellow(`${prefix} ${message}\n`);
        break;
      case "ERROR":
        log.red(`${prefix} ${message}\n`);
        break;
    }
  } else {
    if(logLevel == "ERROR"){
      logger.log("error", message);
    }
  }
}

/**
 * Retourne le stackTrace à partir de la méthode qui l'appelle
 * Source : https://www.labnol.org/code/print-stack-trace-210427
 * @returns Un string avec le stack trace.
 */
export function getStackTrace() {
  const error = new Error();
  const stack = error.stack
    ?.split("\n")
    .slice(2)
    .map((line) => line.replace(/\s+at\s+/, ""))
    .join("\n");
  return stack;
}
