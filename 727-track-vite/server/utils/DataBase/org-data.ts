import { OkPacket } from "mysql";
import { organisation, project, user } from "../../../server-client/types.js";
import { Log, getStackTrace } from "../logging.js";
import { getOrgImagesPath } from "../utils.js";
import { getAdmin } from "./MongoDB/admin-data.js";
import { addNotification } from "./MongoDB/notification-data.js";
import { db } from "./database-connection.js";
import { deleteProject, removeUserFromProject } from "./project-data.js";
import fs from "fs";

/**
 * Trouve une organisation à partir d'un ID
 * @param org_id L'ID de l'organisation
 * @returns  une promesse qui résout à une organisation ou un null si il y a une erreur
 */
export function getOrg(org_id: number): Promise<organisation | null> {
  let promise: Promise<organisation | null> = new Promise((res, rej) => {
    db.query(
      "SELECT * FROM organisations WHERE id_org = ?;",
      [org_id],
      (err, DBres: organisation[]) => {
        if (err) {
          Log(`Couldn't get organisations : ${err}`, "ERROR");
          res(null);
        } else {
          res(DBres[0]);
        }
      }
    );
  });
  return promise;
}

/**
 * Trouve toutes les organisations pour les admins
 * @returns  une promesse qui résout avec toutes les organisations ou un null si il y a une erreur
 */
export function getAllOrgAdmin(): Promise<organisation[] | null> {
  let promise: Promise<organisation[] | null> = new Promise((res, rej) => {
    db.query(
      "SELECT * FROM organisations;",
      (err: any, DBres: organisation[]) => {
        if (err) {
          Log(`Couldn't get organisations : ${err}`, "ERROR");
          res(null);
        } else {
          res(DBres);
        }
      }
    );
  });
  return promise;
}

/**
 * Trouve toutes les organisations d'un utilisateur à partir de son ID
 * @param user_id L'ID de l'utilisateur
 * @returns Une promesse qui résout à une organisation ou un null si il y a une erreur
 */
export function getOrgsFromUser(
  user_id: string
): Promise<organisation[] | null> {
  let promise: Promise<organisation[] | null> = new Promise((res, rej) => {
    db.query(
      "SELECT * FROM organisations WHERE id_org IN (SELECT id_org from r_users_organisations WHERE id_user = ?);",
      [user_id],
      (err, DBres: organisation[]) => {
        if (err) {
          Log(`Couldn't get organisation users  : ${err}`, "ERROR");
          res(null);
        } else {
          res(DBres);
        }
      }
    );
  });
  return promise;
}

/**
 * Obtient le nombre de projets pour une organisation d'un utilisateur
 * @param user_id L'ID de l'utilisateur
 * @param organisation_id L'ID de l'organisation
 * @returns Une promesse qui retourne le nombre de projets pour une organisation d'un utilisateur ou null s'il y a une erreur
 */
export function getUserOrgProjectCount(
  user_id: string,
  organisation_id: number
) {
  let promise: Promise<number | null> = new Promise((res, rej) => {
    db.query(
      `SELECT COUNT(*) FROM projects p JOIN r_users_projects r ON (r.id_project = p.id_project) 
    WHERE organisations_id_org = ? AND id_user = ?;`,
      [organisation_id, user_id],
      (err, dbRes: number[]) => {
        if (err) {
          Log(`Could not get user org project count : ${err}`, "ERROR");
          res(null);
        } else res(Object.values(dbRes[0])[0]);
      }
    );
  });
  return promise;
}
/**
 * Trouve le nombre d'événements associés à un utilisateur et une organisation
 * @param user_id L'ID de l'utilisateur
 * @param organisation_id L'ID de l'organisation
 * @returns Une promesse qui retourne le nombre d'événements pour une organisation d'un utilisateur ou null s'Il y a une erreur
 */
export function getUserEventsOrgCount(
  user_id: string,
  organisation_id: number
) {
  let promise: Promise<number | null> = new Promise((res, rej) => {
    db.query(
      `SELECT COUNT(*) FROM r_users_events r JOIN events e ON r.id_event=e.id_event WHERE r.id_user = ? AND projects_id_project IN (SELECT id_project from projects WHERE organisations_id_org = ?);`,
      [user_id, organisation_id],
      (err, dbRes: number[]) => {
        if (err) {
          Log(`Could not get user events org count : ${err}`, "ERROR");
          res(null);
        } else res(Object.values(dbRes[0])[0]);
      }
    );
  });
  return promise;
}

/**
 * Crée une organisation
 * @param title Le nom de l'organisation
 * @param description La description de l'organisation
 * @param owner_id L'ID de celui qui à créer l'organisation
 * @returns Une promesse qui résout lorsque l'opération est complétée, string vide si il y a eu une erreur, sinon le ID de l'org
 */
export function createNewOrg(
  title: string,
  description: string,
  owner_id: string
): Promise<string> {
  let promise: Promise<string> = new Promise((res, rej) => {
    db.query(
      "INSERT INTO organisations (title, description) VALUES (?, ?)",
      [title, description],
      (err, result: OkPacket) => {
        if (err) {
          Log(`Could not insert into organisations : ${err}`);
          res("");
          return;
        } else {
          db.query(
            "INSERT INTO r_users_organisations VALUES (?, ?, 1)",
            [owner_id, result.insertId],
            (err, DBres) => {
              if (err) {
                Log(`Failed to create organisation because of ${err}`, "ERROR");
                res("");
                return;
              } else {
                res(result.insertId.toString());
              }
            }
          );
        }
      }
    );
  });
  return promise;
}

/**
 * Ajoute un utilisateur dans une organisation
 * @param user_id L'ID de l'utilisateur affecté à l'organisation
 * @param org_id L'ID de l'organisation
 * @returns Une promesse qui résout lorsque l'opération est complétée, vrai si tout a fonctionné, faux sinon
 */
export function addUserToOrg(
  user_id: string,
  org_id: string
): Promise<boolean> {
  let promise: Promise<boolean> = new Promise((res, rej) => {
    db.query(
      "INSERT INTO r_users_organisations VALUES (?, ?, 0)",
      [user_id, org_id],
      (err, DBres) => {
        if (err) {
          Log(`Couldn't add user ${user_id} to org ${org_id}`, "ERROR");
          res(false);
          return;
        } else {
          res(true);
        }
      }
    );
  });
  return promise;
}

/**
 * Trouve tous les utilisateurs qui font partie d'une organisation
 * @param org_id L'ID de l'organisation
 * @returns une promesse qui résout à un tableau d'utilisateurs ou un null si il y a une erreur
 */
export function getUsersFromOrg(org_id: number): Promise<user[] | null> {
  let promise: Promise<user[] | null> = new Promise((res, rej) => {
    db.query(
      "SELECT * FROM users WHERE id_user IN (SELECT DISTINCT id_user FROM r_users_organisations WHERE id_org = ?);",
      [org_id],
      (err, DBres: user[]) => {
        if (err) {
          Log(`Couldn't get organisation users : ${err}`, "ERROR");
          res(null);
        } else {
          res(DBres);
        }
      }
    );
  });
  return promise;
}

/**
 * Vérifie si un utilisateur fait partie d'une organisation
 * @param org_id L'ID de l'organisation
 * @param user_id L'ID de l'utilisateur
 * @returns Un booléen qui représente si l'utilisateur fait partie de l'organisation
 */
// TODO: The function is never called. Fix this tomorrow antoine >:(
export function isUserInOrg(org_id: string, user_id: string): Promise<boolean> {
  let promise: Promise<boolean> = new Promise((res, rej) => {
    db.query(
      "SELECT id_user FROM r_users_organisations WHERE id_user = ? AND id_org = ?;",
      [user_id, org_id],
      (err, DBres: string) => {
        if (err) {
          Log("Could not check if user is in org " + err, "ERROR");
          res(false);
        } else {
          if (DBres[0] == null) {
            res(false);
          } else {
            res(true);
          }
        }
      }
    );
  });
  return promise;
}

/**
 * Trouve si une organisation existe à partir de son nom
 * @param orgName Le nom de l'organisation à trouver
 * @returns Une promesse qui résout vrai si l'organisation existe, faux sinon, null si il y a une erreur
 */
export function orgExists(orgName: string) {
  let promise: Promise<boolean | null> = new Promise((res, rej) => {
    db.query(
      "SELECT COUNT(*) FROM organisations  WHERE title = ?;",
      [orgName],
      (err, DBres: number[]) => {
        if (err) {
          Log(`Could not verify if org exists ${err}`, "ERROR");
          res(null);
        } else {
          res(Object.values(DBres[0])[0] != 0);
        }
      }
    );
  });
  return promise;
}

/**
 * Trouve si un utilisateur a des permissions sur une organisation
 * @param org_id L'ID de l'organistion
 * @param user_id L'ID de l'utilisateur
 * @returns Une promesse qui résout vrai si l'utilisateur a des permissions, faux sinon, null si il y a une erreur
 */
export function hasOrgPerms(org_id: number, user_id: string) {
  let promise: Promise<boolean | null> = new Promise(async (res, rej) => {
    const admin = await getAdmin(user_id.toString());
    if (admin) {
      if (admin.id_user == user_id) {
        res(true);
        return;
      }
    }
    db.query(
      "SELECT COUNT(*) FROM r_users_organisations WHERE id_user = ? AND id_org = ? AND is_owner = 1;",
      [user_id, org_id],
      (err, DBres: number[]) => {
        if (err) {
          Log(`Couldn't get r_users_organisations : ${err}`, "ERROR");
          res(null);
        } else {
          res(Object.values(DBres[0])[0] != 0);
        }
      }
    );
  });
  return promise;
}

/**
 * Trouve toutes les projets associés à une organisation
 * @param id_org L'ID de l'organisation
 * @returns Une promesse qui résout avec un tableau d'ID de projets ou un null si il y a une erreur
 */
export function getOrgProjects(id_org: number) {
  let promise: Promise<number[] | null> = new Promise((res, rej) => {
    db.query(
      "SELECT id_project FROM projects WHERE organisations_id_org = ?;",
      [id_org],
      (err, DBres: { id_project: number }[]) => {
        if (err) {
          Log(`Could not get org projects : ${err}`, "ERROR");
          res(null);
        } else res(DBres.map((x) => x.id_project));
      }
    );
  });
  return promise;
}

/**
 * Efface les liens d'invitation d'une organisation
 * @param id_org L'ID de l'organisation
 * @returns Une promesse vrai ou faux si tu sais tu es
 */
export function deleteOrgLink(id_org: number) {
  let promise: Promise<boolean> = new Promise(async (res, rej) => {
    db.query(
      "DELETE FROM organisation_invite_link WHERE organisations_id_org =?",
      [id_org],
      (err, DBres: any) => {
        if (err) Log(`Could not delete org link : ${err}`, "ERROR");
        res(err == null);
      }
    );
  });
  return promise;
}

/**
 * Efface l'organisation correspondant à une ID d'organisation dans la table entre l'utilisateur et les organisations
 * @param id_org L'ID de l'organisation
 * @returns Une promesse qui retourne vrai si tout fonctionne, faux sinon
 */
export function deleteRUserOrg(id_org: number) {
  let promise: Promise<boolean> = new Promise(async (res, rej) => {
    db.query(
      "DELETE FROM r_users_organisations WHERE id_org =?",
      [id_org],
      (err, DBres: any) => {
        if (err) Log(`Could not delete r_users_organisations: ${err}`, "ERROR");
        res(err == null);
      }
    );
  });
  return promise;
}

/**
 * Efface l'organisation avec l'id correspondant
 * @param projet_id L'ID du projet
 * @returns Une promesse qui retourne vrai si tout fonctionne, faux sinon
 */
export function deleteOrg(id_org: number) {
  let promise: Promise<boolean> = new Promise(async (res, rej) => {
    const taskList = await getOrgProjects(id_org);

    if(taskList == null) { 
      res(false);
      return;
    }

    Promise.all(taskList.map(async item => {
      await deleteProject(item);
    }));
    
    const orgMember = await getUsersFromOrg(id_org);
    const orgName = await getOrg(id_org);
    if (orgMember && orgName) {
      Promise.all(orgMember.map(element => 
        addNotification(
          `L'organisation "${orgName.title}" a été supprimée.`,
          element.id_user
        )
      ));
    }

    await deleteRUserOrg(id_org);
    await deleteOrgLink(id_org);
    fs.rmSync(getOrgImagesPath(`${id_org}`));
    db.query(
      "DELETE FROM organisations WHERE id_org =?",
      [id_org],
      (err, DBres: any) => {
        Log(`Could not delete organisation : ${err}`, "ERROR");
        res(err == null);
      }
    );
  });
  return promise;
}

/**
 * Enlève un utilisateur d'une organisation
 * @param user_id L'utilisateur à enlever
 * @param id_org L'organisation en question
 * @returns Une promesse qui retourne vrai si tout fonctionne, faux sinon
 */
export function removeUserFromOrganisation(user_id: string, id_org: number) {
  let promise: Promise<boolean> = new Promise(async (res, rej) => {
    db.query(
      "SELECT p.id_project FROM r_users_projects r JOIN projects p ON p.id_project = r.id_project WHERE id_user = ? AND organisations_id_org = ?;",
      [user_id, id_org],
      (err, DBres: { id_project: number }[]) => {
        if (err) {
          Log(`Could not remove user from organisation : ${err}`, "ERROR");
          res(false);
          return;
        }
        DBres.forEach((x) => {
          removeUserFromProject(user_id, x.id_project);
        });
        db.query(
          "DELETE FROM r_users_organisations WHERE id_org = ? AND id_user = ?;",
          [id_org, user_id],
          (err, DBres) => {
            if (err)
              Log(
                `Could not delete from r_users_organisations : ${err}`,
                "ERROR"
              );

            res(err == null);
          }
        );
      }
    );
  });
  return promise;
}

export function ModifyOrganisation(
  id_org: number,
  title: string,
  description: string,
  image: Buffer | undefined
) {
  if (image != undefined) {
    fs.writeFileSync(getOrgImagesPath(id_org), image);
  }
  let promise: Promise<boolean> = new Promise(async (res, rej) => {
    db.query(
      "UPDATE organisations SET title=?, description=? WHERE id_org=?;",
      [title, description, id_org],
      (err, DBres) => {
        if (err) Log(`Could not get modify organisation : ${err}`, "ERROR");
        res(err == null);
      }
    );
  });
  return promise;
}
