import { MysqlError } from "mysql";
import { user } from "../../../server-client/types.js";
import { Log } from "../logging.js";
import { db } from "./database-connection.js";

/**
 * Trouve un utilisateur à partir d'un userID
 * @param userID Le userID de l'utilisateur
 * @returns une promesse d'utilisateur
 */
export function getUserDB(userID: number | string): Promise<user | null> {
  let promise: Promise<user | null> = new Promise((res, rej) => {
    db.query(
      "SELECT * FROM users WHERE id_user=?",
      [userID],
      (err: MysqlError | null, DBres: user[]) => {
        if (err) {
          Log(`Could not get user : ${err}`, "ERROR");
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
 * Trouve un utilisateur à partir d'un userID
 * @param userID Le userID de l'utilisateur
 * @returns une promesse d'utilisateur
 */
export function getUserDBfromGoogleID(googleID: string): Promise<user | null> {
  let promise: Promise<user | null> = new Promise((res, rej) => {
    db.query(
      "SELECT * FROM users WHERE id_google=?",
      [googleID],
      (err, DBres: user[]) => {
        if (err) {
          Log(`Could not get user from google ID : ${err}`, "ERROR");
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
 * Trouve si un utilisateur existe dans la BD avec son ID Google
 * @param id_google L'id de la personne en question
 * @returns Si l'utilisateur existe
 */
export function findUser(id_google: string): Promise<boolean> {
  let promise: Promise<boolean> = new Promise((res, rej) => {
    db.query(
      "SELECT * FROM users WHERE id_google = ?;",
      [id_google],
      (err, DBres: user[]) => {
        if (err) {
          Log(`Could not find user : ${err}`, "ERROR");
          res(false);
        } else {
          const _exist = DBres[0];
          if (_exist != null) {
            res(true);
          } else {
            res(false);
          }
        }
      }
    );
  });
  return promise;
}
/**
 * Ajoute un utilisateur à la base de données
 * @param user L'utilisateur à ajouter à la base de données
 * @returns une promesse qui résout lorsque la requête est terminée, vrai si tout fonctionne, faux sinon
 */
export function createNewUser(user: user): Promise<boolean> {
  let promise: Promise<boolean> = new Promise((res, rej) => {
    db.query(
      "INSERT INTO users(username,id_google,token_google,profile_picture) VALUES(?,?,?,?)",
      [user.username, user.id_google, user.token_google, user.profile_picture],
      (err, rer) => {
        if (err) {
          Log(`Couldn't add new user : ${err}`, "ERROR");
        }
        res(err != null);
      }
    );
  });
  return promise;
}

/**
 * Met à jour les informations d'un utilisateur à partir d'un ID google
 * @param username le nom d'utilisateur
 * @param id_google l'id à modifier
 * @param token_google le nouveau token google
 * @param profile_picture la nouvelle photo de profil
 */
export function updateUser(
  username: string | null | undefined,
  id_google: string,
  token_google: string,
  profile_picture: string
) {
  if (username == null || username == undefined) {
    db.query(
      "UPDATE users SET token_google=?, profile_picture=? WHERE id_google=?",
      [token_google, profile_picture, id_google],
      (err) => {
        if(err)
          Log(`Could not update user : ${err}`, "ERROR");
      }
    );
  } else
    db.query(
      "UPDATE users SET username=?, token_google=?, profile_picture=? WHERE id_google=?",
      [username, token_google, profile_picture, id_google],
      (err) => {
        if(err)
          Log(`Could not update user : ${err}`, "ERROR");
      }
    );
}

/**
 * Trouve l'ID d'utilisateur attaché à un token Google
 * @param googleToken le google token à chercher
 * @returns l'ID de l'utilisateur
 */
export function googleToUserID(googleToken: string): Promise<string | null> {
  let promise: Promise<string | null> = new Promise((res, rej) => {
    db.query(
      "SELECT id_user FROM users WHERE token_google=?",
      [googleToken],
      (err, DBres: string[]) => {
        if (err) {
          Log(`Could not find userID from googleID : ${err}`, "ERROR");
          res(null);
        } else {
          if (DBres.length == 0) res(null);
          else res(Object.values(DBres[0])[0]);
        }
      }
    );
  });
  return promise;
}

/**
 * Obtient le refresh token d'une ID google
 * @param id_google le google token à chercher
 * @returns une promesse qui se résout avec le refresh token ou null sinon
 */
export async function idToRefreshToken(
  id_google: string
): Promise<string | null> {
  let promise: Promise<string | null> = new Promise((res, rej) => {
    db.query(
      "SELECT token_google FROM users WHERE id_google=?",
      [id_google],
      (err, DBres: string[]) => {
        if (err) {
          Log(`Could not get refreshtok from google_id : ${err}`, "ERROR");
          res(null);
        } else {
          if (DBres.length == 0) res(null);
          res(Object.values(DBres[0])[0]);
        }
      }
    );
  });
  return promise;
}

/**
 * Obtient les utilisateurs à partir d'une ID d'organisation
 * @param org_id l'ID d'une organisation
 * @returns une promesse qui se résout avec les utilisateurs ou null sinon
 */
export async function getUserFromOrgID(org_id: string): Promise<user[] | null> {
  let promise: Promise<user[] | null> = new Promise((res, rej) => {
    db.query(
      "SELECT * FROM users WHERE id_user IN (SELECT id_user FROM r_users_organisations WHERE id_org = ?);",
      [org_id],
      (err, DBRes) => {
        if (err) {
          Log(`Could not get users in org : ${err}`, "ERROR");
          res(null);
        } else {
          res(DBRes);
        }
      }
    );
  });
  return promise;
}
