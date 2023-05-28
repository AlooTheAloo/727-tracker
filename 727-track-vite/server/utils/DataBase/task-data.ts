import { status, task, user } from "../../../server-client/types.js";
import { Log } from "../logging.js";
import {
  addGoogleTask,
  completeTask,
  deleteGoogleTask,
} from "../../Google/google-tasks-helper.js";
import { getMYSQLDate, notEmpty } from "../utils.js";
import { db } from "./database-connection.js";
import { getUserDB } from "./user-data.js";
import { getAdmin } from "./MongoDB/admin-data.js";
import { addNotification } from "./MongoDB/notification-data.js";
import { OkPacket } from "mysql";
import { log } from "winston";

/**
 * Trouve toutes les tâches pour les admins
 * @returns  une promesse qui résout avec toutes les tâches ou un null si il y a une erreur
 */
export function getAllTaskAdmin(): Promise<task[] | null> {
  let promise: Promise<task[] | null> = new Promise((res, rej) => {
    db.query("SELECT * FROM tasks;", (err: any, DBres: task[]) => {
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
 * Retourne toutes les tâches d'un utilisateur à partir de son ID_Google
 * @param id_google l'ID google de l'utilisateur
 * @param onlyNonCompleted vrai si on retourne seulement les tâches qui ne sont pas complétés
 * @returns une promesse qui résout avec les tâches associés ou un null si il y a un problème
 */
export function getAllTasks(
  id_google: string,
  onlyNonCompleted: boolean
): Promise<task[] | null> {
  let promise: Promise<task[] | null> = new Promise((res, rej) => {
    db.query(
      `SELECT * FROM tasks WHERE id_task IN
    (SELECT id_task FROM r_users_assigned_tasks WHERE id_user =
    (SELECT id_user FROM users WHERE id_google = ?)) ${
      onlyNonCompleted ? "AND status != 'Completed'" : ""
    }`,
      [id_google],
      (err, DBres: task[]) => {
        if (err) {
          Log(`Could not get all tasks : ${err}`, "ERROR");
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
 * Supprime toutes les tâches d'un projet d'un utilisateur
 * @param user_id l'ID de l'utilisateur
 * @param project_id l'ID du projet
 * @returns une promesse qui résout avec vrai si tout marche, faux sinon
 */
export function removeUserProjectTasks(
  user_id: string,
  project_id: number
): Promise<boolean> {
  let promise: Promise<boolean> = new Promise((res, rej) => {
    db.query(
      `SELECT r.google_task_id, u.token_google FROM tasks t
      JOIN projects p ON t.projects_id_project = p.id_project
      JOIN r_users_assigned_tasks r ON t.id_task = r.id_task
      JOIN users u ON r.id_user = u.id_user
      WHERE id_project = ? AND u.id_user = ?;`,
      [project_id, user_id],
      (err, DBres: { google_task_id: string; token_google: string }[]) => {
        if (err) {
          Log(`Could not remove user project tasks : ${err}`, "ERROR");
          res(false);
          return;
        }
        Promise.all(DBres.map(async task => {
          await deleteGoogleTask(task.token_google, task.google_task_id);
        }));

        db.query(
          `DELETE from r_users_assigned_tasks WHERE id_user = ? AND id_task IN (
      SELECT id_task FROM tasks WHERE projects_id_project = ?);`,
          [user_id, project_id],
          (err) => {
            if (err) {
              Log(`Couldn't remove from r_users_assigned_tasks : ${err}`);
              res(false);
            } else res(true);
          }
        );
      }
    );
  });
  return promise;
}

/**
 * Détermine si un utilisateur a le droit de voir une tâche
 * @param task_id L'ID de la tâche à vérifier
 * @param user_id L'ID de l'utilisateur
 * @returns une promesse qui résout avec vrai si l'utilisateur a les permissions, faux sinon
 */
export function canSeeTask(task_id: number, user_id: string) {
  let promise: Promise<boolean> = new Promise((res, rej) => {
    db.query(
      "SELECT COUNT(*) FROM tasks WHERE (user_creator_id = ? OR id_task IN" +
        "(SELECT id_task FROM r_users_assigned_tasks WHERE id_user = ?)) AND id_task = ?;",
      [user_id, user_id, task_id],
      (err, DBres: number[]) => {
        if (err) {
          Log(`Could not check if user can see task : ${err}`, "ERROR");
          res(false);
        } else {
          Log("userid : " + user_id + " task id : " + task_id, "WARN");
          Log("Count is " + Object.values(DBres[0])[0], "ERROR");
          if (DBres.length == 0) res(false);
          res(Object.values(DBres[0])[0] > 0);
        }
      }
    );
  });
  return promise;
}

/**
 * Trouve les détails d'une tâche à partir d'un ID
 * @param task_id l'ID de la tâche à trouver
 * @returns une promesse qui se résout avec une tâche ou un null si il y a un problème
 */
export function getTaskByID(task_id: number): Promise<task | null> {
  let promise: Promise<task | null> = new Promise((res, rej) => {
    db.query(
      "SELECT * FROM tasks WHERE id_task = ?",
      [task_id],
      (err, DBres: task[]) => {
        if (err) {
          Log(`Could not get task by ID : ${err}`, "ERROR");
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
 * Ajoute une tâche à la BD
 * @param title Le titre de la tâche
 * @param description La description de la tâche
 * @param date_todo La date limite de la tâche
 * @param users Les utilisateurs à relier à la tâche
 * @param creatorUserID Le créateur de la tâche
 * @param projet_id Si la tâche a un projet, le projet auquel la tâche est reliée
 * @returns Une promesse qui résout lorsque l'opération est complétée, vrai si tout a fonctionné, faux sinon
 */
export function createNewTask(
  title: string,
  description: string,
  date_todo: Date | undefined,
  users: user[],
  creatorUserID: string,
  projet_id?: number
): Promise<boolean> {
  if (projet_id == -1) projet_id = undefined;
  let promise: Promise<boolean> = new Promise((functionRes, rej) => {
    db.query(
      "INSERT INTO tasks(title,description,date_created,date_todo,status, projects_id_project, user_creator_id) VALUES(?,?,sysdate(),?,'Waiting', ?, ?)",
      [
        title,
        description,
        date_todo == undefined ? undefined : getMYSQLDate(date_todo),
        projet_id == undefined ? null : projet_id,
        creatorUserID,
      ],
      (err, result: OkPacket) => {
        if (err) {
          functionRes(false);
          Log(`Could not create new task : ${err}`, "ERROR");
          return;
        }

         
        const loop = Promise.all(users.map((user, index) => new Promise<void>(async (res, rej) => {

          let taskId = null;
          const fetchedUser = await getUserDB(user.id_user);
          if (fetchedUser?.token_google) {
            // Si le token n'est pas expiré on ajoute la tâche à son google tasks
            taskId = await addGoogleTask(
              fetchedUser?.token_google,
              {
                title: title,
                description: description,
                date_todo: date_todo == undefined ? new Date() : date_todo,
              } as task,
              date_todo == undefined
            );
            if (taskId.error) {
              switch (taskId.error) {
                case "unknownError":
                  res();
                  return;
              }
            }
          }
          await db.query(
            "INSERT INTO r_users_assigned_tasks (id_user, id_task, google_task_id, is_owner) VALUES (?, ?, ?, false)",
            [user.id_user, result.insertId, taskId?.id],
            (err, DBres: OkPacket) => {
              if (err) {
                Log(`Could not add user to task : ${err}`, "ERROR");
              }
              res();
            }
          );
        })));
    
        loop.then(() => {
          functionRes(true);
        });
      }
    );
  });
  return promise;
}

/**
 * Modifie une tâche qui existe dans la BD
 * @param title Le titre de la tâche
 * @param task_id L'ID de la tâche
 * @param description La nouvelle description de la tâche
 * @param date_todo La nouvelle date limite de la tâche
 * @param collaborators Les nouveaux utilisateurs à relier à la tâche
 * @param status L'état de la tâche
 * @returns Une promesse qui résout lorsque l'opération est complétée, vrai si tout a fonctionné, faux sinon
 */
export function ModifyTask(
  title: string,
  task_id: number,
  description: string,
  date_todo: Date | undefined,
  collaborators: (user | null)[],
  status: status,
  modifierName: string
) {
  let promise: Promise<boolean> = new Promise((res, rej) => {

    db.query(
      "UPDATE tasks SET title = ?, description = ?, date_todo = ? WHERE id_task = ?;",
      [
        title,
        description,
        date_todo == undefined ? null : getMYSQLDate(date_todo),
        task_id,
      ],
      async (err, DBres: number[]) => {
        if (err) {
          Log(`Couldn't modify task : ${err}`, "ERROR");
          res(false);
        } else {
          if (collaborators == null) {
            res(false);
          } else
            res(
              await SetTaskCollaborators(
                task_id,
                collaborators.filter(notEmpty),
                modifierName
              )
            );
        }
      }
    );
  });
  return promise;
}

/**
 * Change les collaborateurs et fait une mise à jour du calendrier google
 * @param task_id l'ID de la tâche à changer
 * @param collaborators les nouveaux collaborateurs
 * @param modifierName Le nom de l'utilisateur qui modifie la tâche
 * @returns une promesse qui résout avec vrai si tous fonctionne, faux sinon
 */
export async function SetTaskCollaborators(
  task_id: number,
  collaborators: user[],
  modifierName: string
) {
  interface petitAssignedTask {
    google_task_id: string;
    token_google: string;
    id_user: string;
  }

  let task = await getTaskByID(task_id);

  let promise: Promise<boolean> = new Promise((res, rej) => {
    if (task == null || task == undefined) {
      res(false);
      return;
    }
    db.query(
      `
      SELECT r.google_task_id, u.token_google, u.id_user FROM r_users_assigned_tasks r JOIN users u ON r.id_user = u.id_user
      WHERE r.id_task = ?`,
      [task_id],
      async (err, assignedTask: petitAssignedTask[]) => {
        if (err) {
          Log(`Could not get petitAssignedTask : ${err}`, "ERROR");
          res(false);
          return;
        }

        // AssignedEvent is all the old users
        // Collaborators is all the new users
        // We want to get all the ones who are in new but not also in old (addedUsers)
        const usersAdded = collaborators.filter(x => !assignedTask.map(x => x.id_user).includes(x.id_user));
        // We want to get all the ones who were in old but not also in new 
        const usersRemoved = assignedTask.filter(x => !collaborators.map(x => x.id_user).includes(x.id_user));

        await Promise.all(usersAdded.map(x => { 
          addNotification(`${modifierName} vous a ajouté à la tâche '${task?.title}'`, x.id_user);
        }));

        await Promise.all(usersRemoved.map(async x => { 
          await addNotification(`${modifierName} vous a retiré de la tâche '${task?.title}'`, x.id_user);
        }));

        await Promise.all(assignedTask.map(async x => { 
          await deleteGoogleTask(x.token_google, x.google_task_id);          
        }));

        db.query(
          `DELETE FROM r_users_assigned_tasks where id_task = ?`,
          [task_id],
          async (err) => {
            if (err) {
              Log(
                `Could not delete from r_users_assigned_task : ${err}`,
                "ERROR"
              );
              res(false);
              return;
            }
            
            Promise.all(collaborators.map(async collaborator => {
              if (collaborator == null) return;
              const user = await getUserDB(collaborator.id_user);
              if (user == null) return;

              const googleRes = await addGoogleTask(
                user.token_google,
                {
                  title: task?.title,
                  description: task?.description,
                  date_todo: task?.date_todo,
                } as task,
                task?.date_todo == undefined
              );

              if (googleRes.id != null && googleRes.error == null) {
                // No error

                if (task?.status == "Completed") {
                  completeTask(collaborator.token_google, googleRes.id);
                }
                db.query(
                  "INSERT INTO r_users_assigned_tasks (id_user, id_task, google_task_id) VALUES (?, ?, ?);",
                  [collaborator.id_user, task_id, googleRes.id],
                  (err) => {
                    if (err)
                      Log(
                        `Couldn't insert into r_users_assigned_tasks : ${err}`,
                        "ERROR"
                      );
                    res(err != null);
                  }
                );
              } else {
                // Error, token is invalid. Still add to r_users_assigned_tasks
                db.query(
                  "INSERT INTO r_users_assigned_tasks (id_user, id_task) VALUES (?, ?);",
                  [collaborator.id_user, task_id],
                  (err) => {
                    if (err)
                      Log(
                        `Couldn't insert into r_users_assigned_tasks : ${err}`,
                        "ERROR"
                      );
                    res(err != null);
                  }
                );
              }

            }))
            res(true);
          }
        );
      }
    );
  });

  return promise;
}

/**
 * Change le statut d'une tâche dans la BD
 * @param task_id L'ID de la tâche à modifier
 * @param status Le nouveau statut
 * @returns Une promesse qui résout lorsque l'opération est complétée, vrai si tout a fonctionné, faux sinon
 */
export async function UpdateTaskStatus(task_id: number, status: status) {
  const oldStatus = (await getTaskByID(task_id))?.status;
  if (oldStatus == undefined) return false;

  let promise: Promise<boolean>;
  switch (status) {
    case "Waiting":
      promise = new Promise((res, rej) => {
        db.query(
          "UPDATE tasks SET status='Waiting' WHERE id_task=?;",
          [task_id],
          (err, dbresponse) => {
            if (err) {
              Log(`Couldn't update task status : ${err}`, "ERROR");
              res(false);
            } else {
              if (dbresponse.affectedRows == 0) res(false);
              else res(true);
            }
          }
        );
      });
      break;
    case "In Progress":
      const updateTime = oldStatus == "Waiting";
      promise = new Promise((res, rej) => {
        db.query(
          `UPDATE tasks SET ${
            updateTime ? "date_started=SYSDATE()," : ""
          } status='In Progress' WHERE id_task=?;`,
          [task_id],
          (err, dbresponse) => {
            if (err) {
              Log(`Couldn't update task status : ${err}`, "ERROR");
              res(false);
            } else {
              if (dbresponse.affectedRows == 0) res(false);
              else res(true);
            }
          }
        );
      });
      break;
    case "Completed":
      promise = new Promise((res, rej) => {
        db.query(
          "UPDATE tasks SET date_end=SYSDATE(), status='Completed' WHERE id_task=?;",
          [task_id],
          (err, dbresponse) => {
            if (err) {
              Log(`Couldn't update task status : ${err}`, "ERROR");
              res(false);
            } else {
              if (dbresponse.affectedRows == 0) res(false);
              else res(true);
            }
          }
        );
      });
      break;
  }
  return promise;
}

/**
 * Trouve le nom du créateur d'une tâche à partir d'un ID
 * @param task_id l'ID de la tâche
 * @returns une promesse qui se résout avec le nom du créateur ou null si il y a un problème
 */
export function getTaskAffectedBy(task_id: number): Promise<string | null> {
  let promise: Promise<string | null> = new Promise((res, rej) => {
    db.query(
      "SELECT username FROM users WHERE id_user IN (" +
        "SELECT user_creator_id from tasks WHERE id_task = ?);",
      [task_id],
      (err, DBres: string[]) => {
        if (err || DBres[0] == null) {
          Log(`Couldn't get person who affected task : ${err}`, "ERROR");
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
 * Trouve tous les utilisateurs qui sont affectés à une tâche
 * @param task_id L'id de la tâche à trouver
 * @returns Tous les utilisateurs associés à la tâche
 */
export function getTaskUsers(task_id: number) {
  let promise: Promise<user[] | null> = new Promise((res, rej) => {
    db.query(
      "SELECT * FROM users WHERE id_user IN (" +
        "SELECT id_user FROM r_users_assigned_tasks WHERE id_task = ?" +
        ");",
      [task_id],
      (err, DBRes: user[]) => {
        if (err) {
          Log(`Couldn't get task users : ${err}`, "ERROR");
          res(null);
        } else {
          res(DBRes);
        }
      }
    );
  });
  return promise;
}

/**
 * Trouve si un utilisateur a des permissions sur une tâche
 * @param user_id L'ID de l'utilisateur
 * @param task_id L'ID de la tâche
 * @returns une promesse qui résout avec vrai si tout marche, faux sinon
 */
export function hasTaskPerms(user_id: string, task_id: number) {
  let promise: Promise<boolean> = new Promise(async (res, rej) => {
    const admin = await getAdmin(user_id.toString());

    if (admin) {
      if (admin.id_user == user_id) {
        res(true);
        return;
      }
    }
    db.query(
      "SELECT is_owner FROM r_users_assigned_tasks WHERE id_user = ? AND id_task = ?",
      [user_id, task_id],
      (err, DBres: number[]) => {
        if (err) {
          Log(`Could not check if user has perms on task : ${err}`, "ERROR");
          res(false);
        } else {
          if (DBres.length == 0 || Object.values(DBres[0])[0] == 0) {
            db.query(
              "SELECT user_creator_id FROM tasks WHERE id_task = ?",
              [task_id],
              (err, DBres: number[]) => {
                if (err) {
                  Log(
                    `Could not check if user is creator of task : ${err}`,
                    "ERROR"
                  );
                  return;
                }

                if (DBres.length == 0) res(false);
                else res(Object.values(DBres[0])[0].toString() == user_id);
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
 * Trouve l'ID de tous les utilisateurs affectés à une tâche
 * @param task_id
 * @returns un tableau d'ID
 */
export function getTaskCollaboratorsID(task_id: number) {
  let promise: Promise<number[]> = new Promise((res, rej) => {
    db.query(
      "SELECT id_user FROM r_users_assigned_tasks WHERE id_task = ?;",
      [task_id],
      (err, DBres: number[]) => {
        if (err) {
          Log(`Could not get task collaborator ids : ${err}`, "ERROR");
          res([]);
        } else {
          res(DBres);
        }
      }
    );
  });
  return promise;
}

/**
 * Trouve le ID google d'une tâche
 * @param user_id L'ID de l'utilisateur
 * @param task_id L'ID de la tâche
 * @returns Une promesse qui résout avec l'ID de la tâche google de l'utilisateur
 */
export function getTaskGoogleID(user_id: string, task_id: number) {
  let promise: Promise<string | null> = new Promise((res, rej) => {
    db.query(
      "SELECT google_task_id FROM r_users_assigned_tasks WHERE id_user = ? AND id_task = ?;",
      [user_id, task_id],
      (err, DBres: string[]) => {
        if (err) {
          res(null);
        } else {
          res(Object.values(DBres[0])[0]);
        }
      }
    );
  });
  return promise;
}
/**
 * Efface les liens entre l'utilisateur et la tâche
 * @param task_id L'ID de la tâche
 * @returns Une promesse qui résout vrai si tout fonctionne, faux sinon
 */
export function deleteUserAssignedTask(task_id: number) {
  let promise: Promise<boolean> = new Promise((res, rej) => {
    db.query(
      "SELECT r.google_task_id, u.token_google FROM r_users_assigned_tasks r JOIN users u ON u.id_user=r.id_user WHERE id_task=?",
      [task_id],
      (err, DBres: { google_task_id: string; token_google: string }[]) => {
        if (err) {
          Log(`Couldn't get user assigned tasks : ${err}`, "ERROR");
          res(false);
          return;
        }
        for (const user of DBres) {
          deleteGoogleTask(user.token_google, user.google_task_id);
        }

        db.query(
          "DELETE FROM r_users_assigned_tasks WHERE id_task =?",
          [task_id],
          (err, DBres: any) => {
            if (err) {
              Log(`Couldn't delete tasks : ${err}`, "ERROR");
            }
            res(err == null);
          }
        );
      }
    );
  });
  return promise;
}

/**
 * Efface la tâche correspondant à une ID de tâche
 * @param task_id L'ID de la tâche
 * @returns une promesse qui résout avec vrai si tout marche, faux sinon
 */
export function deleteTask(task_id: number) {
  let promise: Promise<boolean> = new Promise(async (res, rej) => {
    const cond = await deleteUserAssignedTask(task_id);
    if (cond == true) {
      db.query(
        "DELETE FROM tasks WHERE id_task =?",
        [task_id],
        (err, DBres: any) => {
          if (err) {
            Log(`Could not delete task : ${err}`, "ERROR");
          }
          res(err == null);
        }
      );
      const taskMember = await getTaskUsers(task_id);
      const taskName = await getTaskByID(task_id);
      if (taskMember && taskName) {
        Promise.all(taskMember.map(element => {
          addNotification(
            'La tâche " ' + taskName.title + ' " a été supprimé.',
            element.id_user
          );
        }))
      }
    } else {
      res(false);
    }
  });
  return promise;
}
