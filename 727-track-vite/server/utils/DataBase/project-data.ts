import { getMYSQLDate, notEmpty } from "../utils.js";
import Item from "antd/es/list/Item.js";
import { google } from "googleapis";
import {
  event,
  project,
  status,
  task,
  user,
} from "../../../server-client/types.js";
import { db } from "./database-connection.js";
import { deleteTask } from "./task-data.js";
import { removeUserProjectTasks } from "./task-data.js";
import { Log } from "../logging.js";
import { getAdmin } from "./MongoDB/admin-data.js";
import { MysqlError, OkPacket } from "mysql";
import { addNotification } from "./MongoDB/notification-data.js";
import { DeleteEvent, removeUserProjectEvents } from "./event-data.js";

/**
 * Cherche un projet à partir d'un project ID
 * @param projectID L'ID du projet
 * @returns une promesse qui résout avec le projet en question ou un null si il y a une erreur
 */
export function getProject(
  projectID: number | undefined
): Promise<project | null> {
  let promise: Promise<project | null> = new Promise((res, rej) => {
    db.query(
      "SELECT * FROM projects WHERE id_project=?",
      [projectID],
      (err, DBres: project[]) => {
        if (err) {
          Log(`Could not get project : ${err}`, "ERROR");
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
 * Cherche tous les événements reliés à un projet
 * @param projectID L'ID du projet
 * @returns une promesse qui résout avec un tableau d'événements ou un null si il y a une erreur
 */
export function getProjectEvents(projectID: number): Promise<event[] | null> {
  let promise: Promise<event[] | null> = new Promise((res, rej) => {
    db.query(
      "SELECT * FROM events WHERE projects_id_project=?;",
      [projectID],
      (err, DBres: event[]) => {
        if (err) {
          Log(`Could not get project events : ${err}`, "ERROR");
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
 * Trouve toutes les projets pour les admins
 * @returns  une promesse qui résout avec toutes les projets ou un null si il y a une erreur
 */
export function getAllProjectAdmin(): Promise<project[] | null> {
  let promise: Promise<project[] | null> = new Promise((res, rej) => {
    db.query("SELECT * FROM projects;", (err: any, DBres: project[]) => {
      if (err) {
        Log(`Couldn't get projects: ${err}`, "ERROR");
        res(null);
      } else {
        res(DBres);
      }
    });
  });
  return promise;
}
/**
 * Retourne tous les projets d'un utilisateur à partir de son google ID
 * @param google_id l'ID google de l'utilisateur
 * @returns une promesse qui résout à un tableau de projets ou un null si il y a une erreur
 */
export function getAllProjects(google_id: string): Promise<project[] | null> {
  let promise: Promise<project[] | null> = new Promise((res, rej) => {
    db.query(
      "SELECT * FROM projects WHERE id_project IN" +
        "(SELECT id_project FROM r_users_projects WHERE id_user=" +
        "(SELECT id_user FROM users WHERE id_google=?))",
      [google_id],
      (err, DBres: project[]) => {
        if (err) {
          Log(`Could not get all projects : ${err}`, "ERROR");
          res(null);
        } else {
          res(DBres);
        }
      }
    );
  });
  return promise;
}

interface taskNumRet {
  completed: number;
  total: number;
}
/**
 * Trouve toutes les tâches ratachés à un utilisateur et un projet et le
 * nombre de ces dernières qui sont complétés
 *
 * @param user_id L'ID de l'utilisateur
 * @param project_id L'ID du projet
 * @returns un objet qui contient le nombre total de tâches et le nombre de tâches complétés
 */

export function getTaskNum(user_id: number | string, project_id: number) {
  let promise: Promise<taskNumRet | null> = new Promise((res, rej) => {
    db.query(
      "SELECT COUNT(*) from tasks t " +
        "JOIN r_users_assigned_tasks a ON t.id_task=a.id_task " +
        " WHERE projects_id_project = ? AND id_user=?;",
      [project_id, user_id],
      (err, taskCount: number[]) => {
        if (err) {
          Log(`Could not get tasks : ${err}`, "ERROR");
          res(null);
        } else {
          db.query(
            "SELECT COUNT(*) from tasks t " +
              "JOIN r_users_assigned_tasks a ON t.id_task=a.id_task " +
              "WHERE projects_id_project = ? AND id_user=? AND UPPER(status) = 'COMPLETED';",
            [project_id, user_id],
            (err, completedTaskCount: number[]) => {
              if (err) {
                Log(`Could not get completed tasks : ${err}`, "ERROR");
                res(null);
              }

              const returnVal: taskNumRet = {
                completed: Object.values(completedTaskCount[0])[0],
                total: Object.values(taskCount[0])[0],
              };
              res(returnVal);
            }
          );
        }
      }
    );
  });
  return promise;
}

/**
 * Trouve tous les utilisateurs qui font partie d'un projet
 * @param project_id L'ID du projet
 * @returns  une promesse qui résout à un tableau d'utilisateurs ou un null si il y a une erreur
 */
export function getProjectUsers(project_id: number): Promise<user[] | null> {
  let promise: Promise<user[] | null> = new Promise((res, rej) => {
    db.query(
      "SELECT * FROM users WHERE id_user IN " +
        "(SELECT DISTINCT id_user FROM r_users_projects WHERE id_project = ?)",
      [project_id],
      (err, DBres: user[]) => {
        if (err) {
          Log(`Could not get projects users : ${err}`, "ERROR");
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
 * Ajoute un projet à la base de données. Si tu comprends pas, brodeur car :)
 * @param project Le projet à ajouter dans la base de données
 * @param collaborator Une liste d'utilisateur qui représente des collaborateurs
 * @returns Une promesse boolean qui représente
 */
export function addProject(
  project: project,
  collaborators: user[]
): Promise<boolean> {
  let promise: Promise<boolean> = new Promise((res, rej) => {
    db.query(
      "INSERT INTO projects (title, description, date_created, date_modified, date_todo, date_end," +
        "status, user_creator_id, organisations_id_org) VALUES" +
        "(?, ?, ?, ?, ?, ?, ?,?, ?);",
      [
        project.title,
        project.description,
        getMYSQLDate(project.date_created),
        getMYSQLDate(project.date_modified),
        getMYSQLDate(project.date_todo),
        getMYSQLDate(project.date_end),
        project.status,
        project.user_creator_id,
        project.organisations_id_org == -1
          ? null
          : project.organisations_id_org,
      ],
      (err: MysqlError | null, projectResult: OkPacket) => {
        if (err) {
          Log(`Could not insert into projects : ${err}`, "ERROR");
          res(false);
        } else {
          for (const user of collaborators) {
            let isOwner = 0;
            if (user.id_user == project.user_creator_id) isOwner = 1;
            db.query(
              "INSERT INTO r_users_projects VALUES (?, ?, ?);",
              [user.id_user, projectResult.insertId, isOwner],
              (err, userProjectResult) => {
                if (err) {
                  Log(
                    `Could not insert into r_users_projects : ${err}`,
                    "ERROR"
                  );
                  res(false);
                  return;
                }
              }
            );
          }
          res(true);
        }
      }
    );
  });
  return promise;
}

/**
 * Détermine si un utilisateur a le droit de voir un projet
 * @param project_id L'ID du projet à vérifier
 * @param user_id L'ID de l'utilisateur
 * @returns une promesse qui résout avec vrai si l'utilisateur a les permissions, faux sinon
 */
export function canSeeProject(project_id: number, user_id: string) {
  let promise: Promise<boolean> = new Promise((res, rej) => {
    db.query(
      "SELECT COUNT(*) FROM projects WHERE (user_creator_id = ? OR id_project IN " +
        "(SELECT id_project FROM r_users_projects WHERE id_user = ?)) AND id_project = ?;",
      [user_id, user_id, project_id],
      (err, DBres: number[]) => {
        if (err) {
          Log(`Could not check if project is visible : ${err}`, "ERROR");
          res(false);
        } else {
          if (DBres.length == 0) {
            res(false);
            return;
          } // No dbres
          res(Object.values(DBres[0])[0] > 0);
        }
      }
    );
  });
  return promise;
}

/**
 * Trouve le nom du créateur d'un projet à partir d'un ID
 * @param project_id l'ID du projet
 * @returns une promesse qui se résout avec le nom du créateur ou null si il y a un problème
 */
export function getProjectAffectedBy(
  project_id: number
): Promise<string | null> {
  let promise: Promise<string | null> = new Promise((res, rej) => {
    db.query(
      "SELECT username FROM users WHERE id_user IN (SELECT user_creator_id from projects WHERE id_project = ?);",
      [project_id],
      (err, DBres: string[]) => {
        if (err) {
          Log(`Could not find user that created the project : ${err}`, "ERROR");
          res(null);
        } else {
          if (DBres[0] == null) res(null);
          res(Object.values(DBres[0])[0]);
        }
      }
    );
  });
  return promise;
}

/**
 * Trouve le status d'un projet à partir de son ID
 * @param project_id
 * @returns une promesse qui se résout avec le statut ou null s'il y a une erreur
 */
export function getProjectStatus(project_id: number): Promise<status | null> {
  let promise: Promise<status | null> = new Promise((res, rej) => {
    db.query(
      "SELECT status FROM projects WHERE id_project = ?",
      [project_id],
      (err, DBres: status[]) => {
        if (err) {
          Log(`Could not get project status : ${err}`, "ERROR");
          res(null);
        } else {
          res(Object.values(DBres[0])[0] as status);
        }
      }
    );
  });
  return promise;
}

/**
 * Trouve si un utilisateur a des permissions sur un projet
 * @param user_id L'ID de l'utilisateur
 * @param project_id L'ID du projet
 * @returns une promesse qui se résout avec vrai si tout marche, sinon faux
 */
export function hasProjectPerms(user_id: string, project_id: number) {
  let promise: Promise<boolean> = new Promise(async (res, rej) => {
    const admin = await getAdmin(user_id.toString());
    if (admin) {
      if (admin.id_user == user_id) {
        res(true);
        return;
      }
    }
    db.query(
      "SELECT is_owner FROM r_users_projects WHERE id_user = ? AND id_project = ?",
      [user_id, project_id],
      (err, DBres: number[]) => {
        if (err) {
          Log(`Could not check if user has project perms : ${err}`, "ERROR");
          res(false);
        } else {
          if (DBres.length == 0 || Object.values(DBres[0])[0] == 0) {
            db.query(
              "SELECT user_creator_id FROM projects WHERE id_project = ?",
              [project_id],
              (err, DBres: number[]) => {
                if (DBres.length == 0) {
                  Log(`Could not get creator of project : ${err}`, "ERROR");
                  res(false);
                } else res(Object.values(DBres[0])[0].toString() == user_id);
              }
            );
          } else res(true);
        }
      }
    );
  });
  return promise;
}

/**
 * Modifie un projet qui existe dans la BD
 * @param title Le titre de la tâche
 * @param task_id L'ID de la tâche
 * @param description La nouvelle description de la tâche
 * @param date_todo La nouvelle date limite de la tâche
 * @param collaborators Les nouveaux utilisateurs à relier à la tâche
 * @param status L'état de la tâche
 * @param modifierName Le nom de l'utilisateur qui a modifié le projet
 * @returns Une promesse qui résout lorsque l'opération est complétée, vrai si tout a fonctionné, faux sinon
 */
export function ModifyProject(
  title: string,
  project_id: number,
  description: string,
  date_todo: Date | undefined,
  collaborators: (user | null)[],
  status: status,
  modifierName: string
) {
  let promise: Promise<boolean> = new Promise((res, rej) => {
    db.query(
      "UPDATE projects SET title = ?, description = ?, date_todo = ? WHERE id_project = ?;",
      [
        title,
        description,
        date_todo == undefined ? null : getMYSQLDate(date_todo),
        project_id,
      ],
      async (err, DBres: number[]) => {
        if (err) {
          Log(`Couldn't update project : ${err}`, "ERROR");
          res(false);
        } else {
          const oldCollaborators = await getProjectCollaborators(project_id);
          if (oldCollaborators == null) res(false);
          else {
            const newCollaborators = collaborators
              .filter(notEmpty)
              .map((x) => x.id_user);

            const toAdd = newCollaborators.filter(
              (x) => !oldCollaborators.includes(x)
            );
            const toRemove = oldCollaborators.filter(
              (x) => !newCollaborators.includes(x)
            );
            
            Promise.all(toAdd.map(async element => {
              await addUserToProject(element, project_id);
              await addNotification(
                modifierName + ' vous a ajouté au projet "' + title + '"',
                element
              );
            }));
            
            Promise.all(toRemove.map(async element => {
              await removeUserFromProject(element, project_id);
              await addNotification(
                modifierName + ' vous a retiré du projet "' + title + '"',
                element
              )
            }));

            res(true);
          }
        }
      }
    );
  });
  return promise;
}

/**
 * Modifie le statut d'un projet
 * @param project_id L'ID du projet
 * @param status Le nouveau statut de la tâche
 * @returns une promesse qui se résout avec vrai si tout marche, sinon faux
 */
export async function UpdateProjectStatus(project_id: number, status: status) {
  const oldStatus = await getProjectStatus(project_id);
  let promise: Promise<boolean> = new Promise((res, rej) => {
    if (oldStatus == null) {
      res(false);
      return;
    }

    db.query(
      "UPDATE projects SET status = ? WHERE id_project = ?",
      [status, project_id],
      (err, DBres) => {
        if (err) {
          Log(`Couldn't update project status : ${err}`, "ERROR");
          res(false);
          return;
        } else {
          switch (status) {
            case "In Progress":
              // Progression Waiting -> In progress
              if (oldStatus == "Waiting")
                db.query(
                  "UPDATE projects SET date_started = SYSDATE()",
                  [],
                  (err) => {
                    if (err)
                      Log(`Could not update project status : ${err}`, "ERROR");
                    res(err == null);
                  }
                );
            case "Completed":
              db.query(
                "UPDATE projects SET date_end = SYSDATE()",
                [],
                (err) => {
                  if (err)
                    Log(`Could not update project status : ${err}`, "ERROR");
                  res(err == null);
                }
              );
            case "Waiting":
              res(true);
          }
        }
      }
    );
  });

  return promise;
}

/**
 * Trouve toutes les tâches associés à un projet
 * @param project_id L'ID du projet
 * @returns Une promesse qui résout avec un tableau d'ID de tâches ou un null si il y a une erreur
 */
export function getProjectTasks(project_id: number) {
  let promise: Promise<number[] | null> = new Promise((res, rej) => {
    db.query(
      "SELECT id_task FROM tasks WHERE projects_id_project = ?;",
      [project_id],
      (err, DBres: { id_task: number }[]) => {
        if (err) {
          Log(`Could not get project tasks : ${err}`, "ERROR");
          res(null);
        } else res(DBres.map((x) => x.id_task));
      }
    );
  });
  return promise;
}

/**
 * Trouve tous les utilisateurs affectés à un projet
 * @param project_id L'ID du projet
 * @returns Un tableau d'ID d'utilisateurs
 */
export function getProjectCollaborators(project_id: number) {
  let promise: Promise<string[] | null> = new Promise((res, rej) => {
    db.query(
      "SELECT id_user FROM r_users_projects WHERE id_project = ?;",
      [project_id],
      (err, DBres: { id_user: string }[]) => {
        if (err) {
          Log(`Could not get project collaborators : ${err}`, "ERROR");
          res(null);
        } else res(DBres.map((x) => x.id_user));
      }
    );
  });
  return promise;
}

/**
 * Ajoute un utilisateur à un projet
 * @param id_user L'ID de l'utilisateur à ajouter
 * @param id_project L'ID du projet à ajouter
 * @returns une promesse qui résout avec vrai si tout marche, faux sinon
 */
export function addUserToProject(id_user: string, id_project: number) {
  let promise: Promise<boolean> = new Promise((res, rej) => {
    db.query(
      "INSERT INTO r_users_projects (id_user, id_project) VALUES (?, ?)",
      [id_user, id_project],
      (err, DBres) => {
        Log(`could not add user to project : ${err}`, "ERROR");
        if (err) res(false);
        else res(true);
      }
    );
  });
  return promise;
}

/**
 * Enlève un utilisateur d'un projet et enlève toutes les tâches de la BD et google
 * @param id_user L'ID de l'utilisateur à enlever
 * @param id_project L'ID du projet en question
 * @returns une promesse, vrai si tout fonctionne, faux sinon
 */
export function removeUserFromProject(id_user: string, id_project: number) {
  Log(`Removing ${id_project} for ${id_user}`);
  let promise: Promise<boolean> = new Promise((res, rej) => {
    db.query(
      "DELETE FROM r_users_projects WHERE id_user = ? AND id_project = ?",
      [id_user, id_project],
      async (err, DBres) => {
        if (err) {
          Log(`Could not remove user from project : ${err}`, "ERROR");
          res(false);
        } else {
          await removeUserProjectEvents(id_user, id_project);
          await removeUserProjectTasks(id_user, id_project);
          res(true);
        }
      }
    );
  });
  return promise;
}

/**
 * Efface le projet correspondant à une ID de projet dans la table entre l'utilisateur et les projets
 * @param project_id L'ID du projet
 * @returns une promesse qui résout avec vrai si tout marche, faux sinon
 */
export function deleteRUserProject(project_id: number) {
  let promise: Promise<any> = new Promise(async (res, rej) => {
    db.query(
      "DELETE FROM r_users_projects WHERE id_project =?",
      [project_id],
      (err, DBres: any) => {
        if (err) {
          Log(`Could not remove user from project : ${err}`, "ERROR");
        }
        res(err == null);
      }
    );
  });
  return promise;
}

// MASSIVE TODO : delete events when deleting a project and when removing user from project

/**
 * Efface le projet avec l'id correspondant
 * @param projet_id L'ID du projet
 * @returns Une promesse qui retourne vrai si tout fonctionne, faux sinon
 */
export function deleteProject(project_id: number) {
  let promise: Promise<boolean> = new Promise(async (res, rej) => {
    const taskList = await getProjectTasks(project_id);

    if(taskList != null){ 
      Promise.all(taskList.map(x => {
        deleteTask(x);
      }));  
    }
    
    const projMember = await getProjectUsers(project_id);
    const projName = await getProject(project_id);
    if (projMember && projName) {
      await Promise.all(projMember.map(element  => {
        addNotification(
          `Le projet "${projName.title}" a été supprimé.`,
          element.id_user
        );
      }))
    } 

    const evts = await getProjectEvents(project_id);
    if (evts == null) {
      Log("Cannot find evts", "ERROR");
    } else {
      await Promise.all(
        evts.map(async (evt) => {
          DeleteEvent(evt.id_event);
        })
      );
    }

    deleteRUserProject(project_id);
    db.query(
      "DELETE FROM projects WHERE id_project =?",
      [project_id],
      (err, DBres: any) => {
        if (err) Log(`Could not remove user from project : ${err}`, "ERROR");
        res(err == null);
      }
    );
  });
  return promise;
}
