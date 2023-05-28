import cookie from "cookie";
import cookieParser from "cookie-parser";
import dayjs from "dayjs";
import express, { Application } from "express";
import { OAuth2Client } from "google-auth-library";
import { google, oauth2_v2 } from "googleapis";
import { Socket } from "socket.io";
import { sendHtml } from "../utils/create-server.js";
import {
  createNewUser,
  findUser,
  getUserDBfromGoogleID,
  googleToUserID,
  idToRefreshToken,
  updateUser,
} from "../utils/DataBase/user-data.js";
import { RandomGen } from "../utils/utils.js";
import cors from "cors";
import { event, user } from "../../server-client/types.js";
import { Log } from "../utils/logging.js";

export const clientId = process.env.GOOGLE_CLIENT_ID;
export const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
export const oAuth2Client = new OAuth2Client(
  clientId,
  clientSecret,
  "http://localhost:3000/oauth2callback"
);

/**
 * Initialize les services google pour le login/authentification
 * @param app l'objet express représentant l'application
 */
export function initialise_google_services(app: Application) {
  app.use(cors());
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // google auth
  app.get(
    "/oauth2callback",
    async (req: express.Request, res: express.Response) => {
      const code = req.query.code;
      if (typeof code !== "string") {
        Log(
          `Received user in wrong format! Make sure your API key is still valid.`
        );
        return;
      }
      const { tokens } = await oAuth2Client.getToken(code);
      if (tokens.refresh_token == undefined) {
        if (tokens.access_token == undefined) {
          Log(
            `No access token! Probably login from a new device. 
            \nIf you are debugging, you probably just wiped the 'user' table. 
            \nMake sure to remove 727-tracker from your google account.`,
            "ERROR"
          );
          return;
        }

        const user = await getUser(tokens.access_token);
        if (typeof user == "string") {
          Log(
            `Received user in wrong format! Make sure your API key is still valid.`,
            "ERROR"
          );
          return;
        }
        if (user.id == undefined) {
          Log(
            `No user ID received from google! Make sure your API key is still valid.`,
            "ERROR"
          );
          return;
        }
        const refreshtok = await idToRefreshToken(user.id);
        if (refreshtok == null) {
          Log(
            `No refresh token! Probably a login from a new device. 
        \nIf you are debugging, you probably just wiped the 'user' table. 
        \nMake sure to remove 727-tracker from your google account.`,
            "ERROR"
          );
          return;
        }
        await updateUser(
          user.name,
          user.id,
          refreshtok,
          user.picture == undefined ? "" : user.picture
        );

        res
          .cookie("RefreshToken", refreshtok, {
            secure: true,
            expires: dayjs().add(6, "months").toDate(), // in 6 months
          })
          .cookie("UserID", user.id, {
            secure: true,
            expires: dayjs().add(6, "months").toDate(),
          })
          .cookie("UserName", user.given_name, {
            secure: true,
            expires: dayjs().add(6, "months").toDate(),
          })
          .redirect(301, "/home");

        return;
      }
      const user = await getUser(tokens.refresh_token);
      if (typeof user == "string") {
        Log(
          `Received user in wrong format! Make sure your API key is still valid.`
        );
        return;
      }
      if (user.id == undefined) {
        Log(
          `Received user in wrong format! Make sure your API key is still valid.`
        );
        return;
      }
      const exists = await findUser(user.id);
      if (!exists) {
        Log("Creating new user in database", "DEBUG");
        const newUser: user = {
          username:
            user.name == undefined ? "guest" + RandomGen(0, 1e8) : user.name,
          id_google: user.id,
          token_google: tokens.refresh_token,
          profile_picture: user.picture == undefined ? "" : user.picture,
          id_user: "0", // Doesn't matter, it will be created in the next method
        };
        await createNewUser(newUser);
      } else {
        Log("Updating user in database", "DEBUG");
        await updateUser(
          user.name,
          user.id,
          tokens.refresh_token,
          user.picture == undefined ? "" : user.picture
        );
      }

      res
        .cookie("RefreshToken", tokens.refresh_token, {
          secure: true,
          expires: dayjs().add(6, "months").toDate(), // in 6 months
        })
        .cookie("UserID", user.id, {
          secure: true,
          expires: dayjs().add(6, "months").toDate(),
        })
        .cookie("UserName", user.given_name, {
          secure: true,
          expires: dayjs().add(6, "months").toDate(),
        })
        .redirect(301, "/home");
    }
  );

  // Serve every other page
  app.get("/*", async function (req, res) {
    if (req.url == "/favicon.ico") {
      return;
    }

    const validCookie =
      (await verifyToken(req)) &&
      (await getUserDBfromGoogleID(req.cookies.UserID)) != null;
    if (req.url == "/login") {
      if (validCookie) {
        // Valid login, but wants to login again (?)
        res.redirect("/home");
      } else {
        sendHtml(req, res);
      }
    } else {
      if (validCookie) {
        sendHtml(req, res);
      } else {
        // Session expired
        res.redirect("/login");
      }
    }
  });
}

/**
 * Génère un lien d'authentification pour la session courante
 * @returns Un lien pour authentifier l'utilisateur avec son compte google
 */
export function generateAuthUrl(): string {
  // Generate the url that will be used for the consent dialog.
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope:
      "https://www.googleapis.com/auth/userinfo.profile " +
      "https://www.googleapis.com/auth/calendar " +
      "https://www.googleapis.com/auth/tasks",
  });
  return authorizeUrl;
}

const no_wifi_debug_mode = false; 

/**
 * Vérifie la validité d'un refresh token google avec une requête express ou un string
 * @param {express.Request | string }req la requête contenant un cookie token ou le token comme tel
 * @returns {Promise<Boolean>} une promise de boolean représentant si le token est valide ou non
 */
export async function verifyToken(
  req: express.Request | string
): Promise<boolean> {
  if (no_wifi_debug_mode) {
    return true;
  }
  let cookies;
  let token: string;
  if (typeof req === "object") {
    try {
      cookies = req.cookies;
    } catch (e) {
      return false;
    }

    token = cookies.RefreshToken!;
  } else token = req;

  oAuth2Client.setCredentials({
    refresh_token: token,
  });
  let promise: Promise<boolean>;

  promise = new Promise((res, rej) => {
    oAuth2Client.refreshAccessToken((err) => {
      if (!err) {
        res(true);
      } else {
        res(false);
      }
    });
  });

  return promise;
}

/**
 * Convertis un tooken en client utilisé pour connections google
 * @param token le token (généralement aquis par la méthode getTokenFromSocket)
 * @returns le client OAuth2
 */
export async function tokenToAuth(token: string) {
  try {
    return google.auth.fromJSON({
      type: "authorized_user",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: token,
    });
  } catch (err) {
    return null;
  }
}

/**
 * Retourne un certain nombre événements associés au token
 * @param token Le token de l'utilisateur
 * @param count Le nombre d'événements à aller chercher
 * @returns Le tableau des événements, ou une erreur si il y en a eu une
 */
async function getEvents(token: string, count: number) {
  let auth: OAuth2Client | null = (await tokenToAuth(
    token
  )) as OAuth2Client | null;
  if (auth == null) return ["disconnected"];
  const calendar = google.calendar({ version: "v3", auth });
  try {
    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: count,
      singleEvents: true,
      orderBy: "startTime",
    });
    const events = res.data.items;
    if (!events || events.length === 0) {
      return [];
    }
    return events;
  } catch (err: any) {
    if (err.errors[0].reason === "insufficientPermissions") {
      return ["insufficientPermissions"];
    }
  }
}

/**
 * Trouve les informations associés à un utilisateur google avec son token
 * @param token le token de l'utilisateur en question
 * @returns le schéma de l'utilisateur ou un string représentant une erreur
 */
async function getUser(
  token: string
): Promise<oauth2_v2.Schema$Userinfo | string> {
  let auth: OAuth2Client | null = (await tokenToAuth(
    token
  )) as OAuth2Client | null;
  if (auth == null) return "disconnected1";
  const user = google.oauth2({ version: "v2", auth });
  return new Promise((res, rej) => {
    user.userinfo.get((err, googleRes) => {
      if (googleRes == null) res("disconnected2");
      else if (googleRes.data == undefined) {
        res("disconnected3");
      } else {
        res(googleRes.data);
      }
    });
  });
}

/**
 * Trouves le url d'un socket
 * @param socket le socket en question
 * @returns l'extension de l'url visité (ex. "/login" ou "/")
 */
function getUrl(socket: Socket): string {
  const url = socket.request.headers.referer!;
  const host = socket.request.headers.host!;
  return url.substring(url.indexOf(host) + host.length, url.length);
}

/**
 * Trouves le token associé avec le socket
 * @param socket le socket à investiguer
 * @returns le token associé ou un string vide dans le cas d'une erreur
 */
export function getTokenFromSocket(socket: Socket): string {
  if (socket.request.headers.cookie == undefined) {
    return "";
  } else return cookie.parse(socket.request.headers.cookie).RefreshToken;
}

/**
 * Trouve le google User ID à partir d'un socket
 * @param socket le socket en question
 * @returns le google user ID
 */
export function getGoogleIdFromSocket(socket: Socket): string {
  if (socket.request.headers.cookie == undefined) {
    return "";
  } else return cookie.parse(socket.request.headers.cookie).UserID;
}

/**
 * Trouve le google User ID à partir d'un socket
 * @param socket le socket en question
 * @returns le google user ID
 */
export function getGoogleTokenFromSocket(socket: Socket): string {
  if (socket.request.headers.cookie == undefined) {
    return "";
  } else return cookie.parse(socket.request.headers.cookie).RefreshToken;
}

/**
 * Trouve le User ID à partir d'un socket
 * @param socket le socket à utiliser pour extraire l'information
 * @returns l'ID de l'utilisateur
 */
export function getUserIDFromSocket(socket: Socket): Promise<string> {
  const google_token: string = getGoogleTokenFromSocket(socket);

  return new Promise((res, rej) => {
    googleToUserID(google_token).then((r) => {
      if (r == null) res("");
      else res(r);
    });
  });
}
