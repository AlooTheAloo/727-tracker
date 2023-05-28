import { organisation } from "../../../server-client/types.js";
import { Log } from "../logging.js";
import { RandomGen, getMYSQLDate } from "../utils.js";
import { db } from "./database-connection.js";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LINK_LENGTH = 80;
const ALLOWED_CHARS = ALPHABET + ALPHABET.toLowerCase() + "0123456789";

/**
 * Crée un lien d'invitation avec les paramètres demandés
 * @param max_uses Nombre maximal d'utilisations
 * @param max_date Date limite d'utilisation de l'invitation ou -1 si il n'y a pas de limite
 * @param org_id ID de l'organisation
 * @param hasPerms Vrai si le lien donne des permissions à l'utilisateur
 * @returns Une promesse qui résout avec le lien créé ou null si il y a eu une erreur
 */
export async function createInviteLink(
  org_id: number,
  max_date: string | number,
  max_uses: number,
  hasPerms: boolean
): Promise<string | null> {
  let link = "";

  while (true) {
    for (let i = 0; i < LINK_LENGTH; i++) {
      link += ALLOWED_CHARS[RandomGen(0, ALLOWED_CHARS.length - 1)];
    }
    // Loop jusqu'à ce qu'on génère un lien original
    const exists = (await linkToOrg(link)) != null;
    if (!exists) break;
    else link = "";
  }

  let promise: Promise<string | null> = new Promise(async (res, rej) => {
    db.query(
      "INSERT INTO organisation_invite_link (link, remaining_uses, limit_date, organisations_id_org, hasPerms) VALUES (?, ?, ?, ?, ?)",
      [
        link,
        max_uses == -1 ? null : max_uses,
        typeof max_date == "number" ? null : max_date,
        org_id,
        hasPerms,
      ],
      (err, DBres: any) => {
        if (err) {
          res(null);
          Log(`Couldn't insert into organisation_invite_link ${err} `, "ERROR");
        } else res(link);
      }
    );
  });

  return promise;
}

/**
 * Trouve si un lien d'invitation existe et est valide
 * @param link Le lien à trouver
 * @returns Une promesse qui résout avec l'organisation du lien ou null si l'invitation est invalide ou il y a eu une erreur
 */
export async function linkToOrg(link: string): Promise<organisation | null> {
  let promise: Promise<organisation | null> = new Promise(async (res, rej) => {
    db.query(
      `SELECT o.* FROM organisation_invite_link l
        JOIN organisations o ON o.id_org = l.organisations_id_org
        WHERE link = ? AND (remaining_uses > 0 OR remaining_uses IS NULL) AND (limit_Date > SYSDATE() OR limit_Date IS NULL);`,
      [link],
      (err, DBres: organisation[]) => {
        if (err) {
          res(null);
          Log(`Could not get organisation from link ${link} : ${err}`, "ERROR");
        } else res(DBres[0]);
      }
    );
  });

  return promise;
}

/**
 * Enlève tous les liens invalides de la bd
 * @returns une promesse qui se résout avec vrai si tout marche, sinon faux
 */
export function clearInvalidLinks() {
  let promise: Promise<boolean> = new Promise(async (res, rej) => {
    db.query(
      `DELETE FROM organisation_invite_link l 
        WHERE l.remaining_uses <= 0  OR limit_date < SYSDATE() OR organisations_id_org NOT IN (SELECT id_org FROM organisations);`,
      (err, DBres) => {
        if (err) {
          res(false);
          Log(`Could not clear invalid links : ${err}`, "ERROR");
        } else res(true);
      }
    );
  });

  return promise;
}

/**
 * Accepte une invitation et met à jour la table d'invitations
 * @param link Le lien d'invitation accepté
 * @returns Une promesse qui résout avec vrai si tout fonctionne, faux sinon.
 */
export function acceptOrgInvitation(
  link: string,
  userID: string
): Promise<boolean | null> {
  let promise: Promise<boolean | null> = new Promise(async (res, rej) => {
    await clearInvalidLinks();
    const orgID = (await linkToOrg(link))?.id_org;
    const isAdmin = await isLinkAdmin(link);
    if (orgID == null) {
      res(false);
      return;
    }

    db.query(
      `SELECT remaining_uses FROM organisation_invite_link WHERE link=?`,
      [link],
      (err: any, DBres: number[]) => {
        if (err) {
          Log(`Could not get remaining_uses : ${err}`, "ERROR");
          res(null);
          return;
        } else {
          const use_count = Object.values(DBres[0])[0];
          if (use_count <= 0 && use_count != null) {
            res(false);
            return;
          } else {
            db.query(
              "UPDATE organisation_invite_link SET remaining_uses = remaining_uses - 1 WHERE link = ?;",
              [link],
              (err: any) => {
                if (err) {
                  Log(`Could not reduce amount of uses : ${err}`, "ERROR");
                  res(null);
                  return;
                }
                db.query(
                  "INSERT INTO r_users_organisations VALUES (?, ?, ?)",
                  [userID, orgID, isAdmin],
                  (err) => {
                    Log(`Could not add user to org : ${err}`, "ERROR");
                    res(err ? null : true);
                    return;
                  }
                );
              }
            );
          }
        }
      }
    );
  });

  return promise;
}

/**
 * Trouve si un lien devrait donner des permissions d'administrateur
 * @param link Le lien à rechercher
 * @returns une promesse qui résout avec vrai/faux, ou null si il y a une erreur
 */
function isLinkAdmin(link: string) {
  let promise: Promise<boolean | null> = new Promise(async (res, rej) => {
    db.query(
      "SELECT hasPerms from organisation_invite_link WHERE link = ?;",
      [link],
      (err: any, DBRes: number[]) => {
        if (DBRes.length == 0 || err) {
          Log(
            `Couldn't check if user has perms on organisation : ${err}`,
            "ERROR"
          );
          res(null);
          return;
        }
        res(Object.values(DBRes[0])[0] == 1);
      }
    );
  });
  return promise;
}
