import { MysqlError, OkPacket } from "mysql";
import { event, user } from "../../../server-client/types.js";
import {
  addGoogleEvent,
  deleteGoogleEvent,
} from "../../Google/google-events-helper.js";
import { Log } from "../logging.js";
import { getMYSQLDate } from "../utils.js";
import { db } from "./database-connection.js";
import { getUserDB } from "./user-data.js";
import { deleteUserAssignedTask, getTaskByID } from "./task-data.js";
import { deleteGoogleTask } from "../../Google/google-tasks-helper.js";
import { addNotification } from "./MongoDB/notification-data.js";

/**
 * Trouve un événement à partir d'un ID d'événement
 * @param id_event l'ID de l'événement à trouver
 * @returns une promesse qui résout à l'événement ou un null si il y a une erreur
 */
export function getEventDB(id_event: number): Promise<event | null> {
  let promise: Promise<event | null> = new Promise((res, rej) => {
    db.query(
      "SELECT * FROM events WHERE id_event=?",
      [id_event],
      (err, DBres: event[]) => {
        if (err) {
          Log("Could not get events : " + err, "ERROR");
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
 * Ajoute un événement à la base de données et aux comptes google de tous les utilisateur
 * @param title Le titre de l'événement
 * @param project_id L'ID du projet associé, (-1, undefined ou null si aucun projet)
 * @param users Un tableau des utilisateurs à associer à l'événement
 * @param date_start Le datetime de commencement, en format ISO
 * @param date_end Le datetime de la fin, en format ISO
 * @returns Une promesse qui résout vrai si au moins l'ajout marche, faux sinon
 */
export function addEventDB(
  title: string,
  project_id: number | null | undefined,
  users: user[],
  date_start: string,
  date_end: string
) {
  let promise: Promise<boolean> = new Promise((res, rej) => {
    if (project_id == -1 || project_id == undefined) project_id = null;
    db.query(
      `INSERT INTO events (title, date_start, date_end, projects_id_project) VALUES (?, ?, ?, ?)`,
      [title, date_start, date_end, project_id],
      async (err: MysqlError | null, result: OkPacket) => {
        if (err == null) {
          // Add users

          await Promise.all(
            users.map(async (user) => {
              const googleRes = await addGoogleEvent(
                (await getUserDB(user.id_user))?.token_google ?? "",
                {
                  title: title,
                  date_start: date_start,
                  date_end: date_end,
                } as event
              );

              if (googleRes.error) {
                db.query(
                  `INSERT INTO r_users_events (id_user, id_event) VALUES (?, ?)`,
                  [user.id_user, result.insertId],
                  (err: MysqlError | null, okPacket: OkPacket) => {
                    if (err) Log("Could not add to r_users_events : " + err);
                  }
                );
              } else {
                db.query(
                  `INSERT INTO r_users_events (id_user, id_event, google_event_id) VALUES (?, ?, ?)`,
                  [user.id_user, result.insertId, googleRes.id],
                  (err: MysqlError | null, okPacket: OkPacket) => {
                    if (err) Log("Could not add to r_users_events : " + err);
                  }
                );
              }
            })
          );
          res(true); // Worked
        } else res(false);
      }
    );
  });
  return promise;
}

/**
 * Trouve tous les utilisateurs reliés à un utilisateurs (par organisation)
 * @param id_user l'ID de l'événement à trouver
 * @returns une promesse qui résout à l'événement ou un null si il y a une erreur
 */
export function getAllLinkedUsers(user_id: string): Promise<user[] | null> {
  let promise: Promise<user[] | null> = new Promise((res, rej) => {
    db.query(
      `SELECT * FROM users WHERE id_user IN (
      SELECT id_user FROM r_users_organisations WHERE id_org IN (
      SELECT DISTINCT id_org FROM r_users_organisations WHERE id_user = ?
      )) OR id_user = ?;`,
      [user_id, user_id],
      (err, DBres: user[]) => {
        if (err) {
          Log("Could not get linked users : " + err);
          res(null);
        } else res(DBres);
      }
    );
  });

  return promise;
}

/**
 * Supprime tous les événements attachés à un projet
 * @param user_id id de l'utilisateur à retirer
 * @param event_id id du projet à retirer
 * @return une promesse qui résout avec un boolean. vrai si tout fonctionne, faux sinon
 */
export function removeUserProjectEvents(user_id: string, project_id: number) {
  let promise: Promise<boolean> = new Promise(async (res, rej) => {
    const user = await getUserDB(user_id);
    if (user == null) res(false);
    db.query(
      `SELECT google_event_id from r_users_events WHERE id_user = ? AND id_event IN (
      SELECT id_event FROM events WHERE projects_id_project = ?
    );`,
      [user_id, project_id],
      (err, google_event_ids: string[]) => {
        if (err) {
          Log("Could not get get google events : " + err, "DEBUG");
          res(false);
        } else {
          Promise.all(
            google_event_ids.map((event_id) => {
              if (user?.token_google != undefined) {
                deleteGoogleEvent(user.token_google, event_id);
              } else
                return new Promise<void>((res) => {
                  res();
                });
            })
          );

          db.query(
            `DELETE from r_users_events WHERE id_user = ? AND id_event IN (
          SELECT id_event FROM events WHERE projects_id_project = ?
        );`,
            [user_id, project_id],
            (err, DBres: OkPacket) => {
              if (err) {
                Log("Could not delete from r_users_events : " + err, "ERROR");
              }
              res(err == null);
            }
          );
        }
      }
    );
  });

  return promise;
}

/**
 * Trouve si un utilisateur a des permissions sur un événement
 * @param event_id L'événement à tester
 * @param user_id L'utilisateur en question
 * @returns une promesse qui retourne si l'utilisateur a des permissions ou null si il y a une erreur
 */
export function hasEventPerms(event_id: number, user_id: string) {
  let promise: Promise<boolean | null> = new Promise((res, rej) => {
    db.query(
      `SELECT COUNT(*) FROM r_users_events WHERE id_event = ? AND id_user = ?;`,
      [event_id, user_id],
      (err, DBres: number[]) => {
        if (err) {
          Log("Could not get if user has event perms : " + err, "ERROR");
          res(null);
        } else res(Object.values(DBres[0])[0] != 0);
      }
    );
  });
  return promise;
}

/**
 * Modifie un projet dans la base de données et sur google
 * @param event_id l'ID de l'événement à modifier
 * @param collaborators Les nouveaux collaborateurs
 * @param start_date La nouvelle date de début
 * @param end_date La nouvelle date de fin
 * @returns Une promesse qui résout avec vrai si tout fonctionne, faux sinon
 */
export function ModifyEvent(
  event_id: number,
  collaborators: user[],
  start_date: string,
  end_date: string
) {
  let promise: Promise<boolean> = new Promise((res, rej) => {
    db.query(
      "UPDATE events SET date_start=?, date_end=? WHERE id_event = ?;",
      [start_date, end_date, event_id],
      async (err: MysqlError | null, dbres: OkPacket) => {
        if (err) {
          Log("Could not modify event : " + err, "ERROR");
          res(false);
          return;
        } else {
          const setCollabRes = await SetEventCollaborators(event_id, collaborators);
          res(setCollabRes);
        }
      }
    );
  });
  return promise;
}

/**
 * Supprime un projet dans la base de données et sur google
 * @param event_id l'ID de l'événement à modifier
 * @returns Une promesse qui résout avec vrai si tout fonctionne, faux sinon
 */
export function DeleteEvent(event_id: number) {
  let promise: Promise<boolean> = new Promise(async (res, rej) => {
    const cond = await deleteRUserEvents(event_id);
    if (cond == true) {
      db.query(
        "DELETE FROM events WHERE id_event = ?",
        [event_id],
        (err, DBres: any) => {
          if (err) Log("Could not delete from events : " + err, "ERROR");
          res(err == null);
        }
      );
    } else {
      res(false);
    }
  });
  return promise;
}

/**
 * Supprime tous les liens entre les utilisateurs et un événement
 * @param event_id L'ID de l'événement
 * @returns Une promesse qui résout vrai si tout fonctionne, faux sinon
 */
export function deleteRUserEvents(event_id: number) {
  let promise: Promise<boolean> = new Promise((res, rej) => {
    db.query(
      "SELECT r.google_event_id, u.token_google FROM r_users_events r JOIN users u ON u.id_user=r.id_user WHERE id_event=?;",
      [event_id],
      (err, DBres: { google_event_id: string; token_google: string }[]) => {
        if (err) {
          Log(`Couldn't get user assigned events : ${err}`, "ERROR");
          res(false);
          return;
        }
        for (const user of DBres) {
          deleteGoogleEvent(user.token_google, user.google_event_id);
        }

        db.query(
          "DELETE FROM r_users_events WHERE id_event = ?",
          [event_id],
          (err, DBres: any) => {
            if (err) {
              Log(`Couldn't delete from r_users_events : ${err}`, "ERROR");
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
 * Trouve tous les événements attachés à un utilisateur
 * @param userID L'ID de l'uitlisateur
 * @returns Une promesse qui résout avec une liste d'événements ou null si il y a une erreur
 */
export function getEventsForUser(userID: string): Promise<event[] | null> {
  let promise: Promise<event[] | null> = new Promise((res, rej) => {
    db.query(
      `SELECT * FROM events WHERE id_event IN (SELECT id_event FROM r_users_events WHERE id_user = ?)`,
      [userID],
      (err, DBres: event[]) => {
        if (err) {
          Log("Could not get events for user : " + err, "ERROR");
          res(null);
        } else res(DBres);
      }
    );
  });
  return promise;
}

/**
 * Trouve si un utilisateur peut voir un événement
 * @param user_id L'ID de l'utilisateur
 * @returns Une promesse boolean, vrai si l'utilisateur peut voir, faux sinon
 */
export async function canseeEvent(
  user_id: string,
  event_id: number
): Promise<boolean> {
  let promise: Promise<boolean> = new Promise((res, rej) => {
    db.query(
      `SELECT COUNT(*) FROM r_users_events WHERE id_event = ? and id_user = ?;`,
      [event_id, user_id],
      (err, DBres: number[]) => {
        if (err) {
          Log("Could not check if user can see event : " + err, "ERROR");
          res(false);
        } else res(Object.values(DBres[0])[0] > 0);
      }
    );
  });
  return promise;
}

export async function getUsersEvent(event_id: number) {
  let promise: Promise<user[] | null> = new Promise((res, rej) => {
    db.query(
      `SELECT * FROM users WHERE id_user IN (
      SELECT id_user FROM r_users_events WHERE id_event = ?
    );`,
      [event_id],
      (err, DBres: user[]) => {
        if (err) {
          Log("Could not get users that can see event : " + err, "ERROR");
          res(null);
        } else res(DBres);
      }
    );
  });
  return promise;
}

/**
 * Change les collaborateurs d'un event et fait une mise à jour du calendrier google
 * @param event_id l'ID de la tâche à changer
 * @param collaborators les nouveaux collaborateurs
 * @returns une promesse qui résout avec vrai si tous fonctionne, faux sinon
 */
export async function SetEventCollaborators(
  event_id: number,
  collaborators: user[]
) {
  interface petitAssignedEvent {
    google_event_id: string;
    token_google: string;
    id_user: string;
  }

  let event = await getEventDB(event_id);

  let promise: Promise<boolean> = new Promise((functionRes, rej) => {
    if (event == null || event == undefined) {
      functionRes(false);
      return;
    }
    db.query(`SELECT r.google_event_id, u.token_google, u.id_user FROM r_users_events r JOIN users u ON r.id_user = u.id_user
    WHERE r.id_event = ?;`,
      [event_id],
      async (err, assignedEvent: petitAssignedEvent[]) => {
        if (err) {
          functionRes(false);
          return;
        }
        // AssignedEvent is all the old users
        // Collaborators is all the new users
        // We want to get all the ones who are in new but not also in old (addedUsers)
        const usersAdded = collaborators.filter(x => !assignedEvent.map(x => x.id_user).includes(x.id_user));
      
        // We want to get all the ones who were in old but not also in new (removedUsers)
        const usersRemoved = assignedEvent.filter(x => !collaborators.map(x => x.id_user).includes(x.id_user));

        await Promise.all(usersAdded.map(x => { 
          addNotification(`Vous avez été ajouté à l'événement '${event?.title}'`, x.id_user);
        }));

        await Promise.all(usersRemoved.map(x => { 
           addNotification(`Vous avez été retiré de l'événement '${event?.title}'`, x.id_user);
        }));

        await Promise.all(assignedEvent.map(x => {
          deleteGoogleEvent(x.token_google, x.google_event_id);
        }));
        
        assignedEvent.map(x => x.token_google);
        let promise = new Promise<void>((res, rej) => {
          db.query(
            `DELETE FROM r_users_events where id_event = ?;`,
            [event_id],
            async (err) => {
              if (err) {
                Log(`Couldn't delete from r_users_events : ${err}`, "ERROR");
                functionRes(false);
                return;
              }
              
              await Promise.all(collaborators.map( (collaborator, promiseIndex) => {
                return new Promise<void>(async (res, rej) => {
                  if (collaborator == null) return;
                  const user = await getUserDB(collaborator.id_user);
  
                  if (user == null) return;
  
                  const googleRes = await addGoogleEvent(user.token_google, {
                    title: event?.title,
                    date_start: event?.date_start,
                    date_end: event?.date_end,
                  } as event);
  
                  if (googleRes.id != null && googleRes.error == null) {
                    // No error
                    db.query(
                      "INSERT INTO r_users_events (id_user, id_event, google_event_id) VALUES (?, ?, ?);",
                      [collaborator.id_user, event_id, googleRes.id],
                      (err) => {
                        if (err){
                          Log(
                            `Couldn't insert into r_users_events : ${err}`,
                            "ERROR"
                          );
                          functionRes(false);
                        }
                        res();
                      }
                    );
                  } else {
                    // Error, token is invalid. Still add to r_users_assigned_tasks
                    db.query(
                      "INSERT INTO r_users_assigned_tasks (id_user, id_task) VALUES (?, ?);",
                      [collaborator.id_user, event_id],
                      (err) => {
                        if (err){ 
                          Log(
                            `Couldn't insert into r_users_events : ${err}`,
                            "ERROR"
                          );
                          functionRes(false);
                        }
                        res();
                      }
                    );
                  }
                })
              }));
              res();
            }
          );
        });
        await promise;
        functionRes(true);
      }
    );
  });

  return promise;
}
