import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Log } from "./logging.js";

const isProd = process.env.NODE_ENV === "production";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Fonction utilitaire pour utiliser des paths relatifs à partir du root.
 * NE PAS UTILISER DANS UN IMPORT !!
 * @param path Le chemin du fichier à partir du root
 * @returns {string} Le chemin absolu représentant le fichier/dossier
 */
export function fromRoot(path: string): string {
  return join(__dirname, isProd ? "../../../" : "../../", path);
}

/**
 * Fonction utilitaire qui retourne le directory d'image d'organisations
 * @returns Le directory d'image d'organisations
 */
export function getOrgImagesPath(fileName?: string | number): string {
  return fromRoot("/server-files/images/org-images/" + (fileName ?? ""));
}

/**
 * Génère un nombre random entre min et max
 * @param min le minimum
 * @param max le maximum
 * @returns un nombre aléatoire entre min et max
 */
export function RandomGen(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Convertis une date en string RFC 3339. Utile pour les évènements Google
 * @param date La date à convertir en string
 * @returns le string RFC 3339
 */
export function getIsoString(date: Date) {
  date = new Date(date);
  const localISOTime = new Date(date.getTime()).toISOString();
  return localISOTime;
}

/**
 * Convertis une date en string DATE mysql
 * @param date La date à convertir en string
 * @returns Le string MYSQL
 */
export function getMYSQLDate(date: Date | string | undefined): string {
  if (typeof date != "string" && date != undefined) {
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
  }
  if (date == undefined) return getMYSQLDate(new Date());
  return new Date(date).toISOString().slice(0, 19).replace("T", " ");
}

/**
 * Trouve si un objet n'est pas vide (utile pour filter un tableau)
 * Source : https://stackoverflow.com/questions/43118692/typescript-filter-out-nulls-from-an-array
 * @param value l'objet à tester
 * @returns vrai si l'objet n'est pas vide
 */
export function notEmpty<TValue>(
  value: TValue | null | undefined
): value is TValue {
  return value !== null && value !== undefined;
}
