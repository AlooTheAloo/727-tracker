import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import { task } from "../../server-client/types.js";
import { getIsoString } from "../utils/utils.js";
import { tokenToAuth } from "./google-profile-helper.js";
import { Log } from "../utils/logging.js";

export const clientId =
  "10251414410-sblb3u06rfde9bbmtef66907i2bqi10f.apps.googleusercontent.com";
export const clientSecret = "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";

interface addTaskRes {
  error?: "disconnected" | "noTaskList" | "unknownError";
  id?: string;
}
/**
 * Crée un événement dans le calendrier de l'utilisateur
 * @param token Le token de l'utilisateur
 * @param task La tâche à créer
 * @returns L'ID de la tâche ou une erreur
 */
export async function addGoogleTask(
  token: string,
  task: task,
  noDateLimit = false
): Promise<addTaskRes> {
  let auth: OAuth2Client | null = (await tokenToAuth(
    token
  )) as OAuth2Client | null;
  if (auth == null) return { error: "disconnected" };

  const tasksAPI = google.tasks({ version: "v1", auth });
  try {
    const schema = await tasksAPI.tasklists.list();
    if (schema.data.items == null) return { error: "noTaskList" };
    const taskList = schema.data.items[0];
    if (taskList.id == null) return { error: "noTaskList" };
    const res = await tasksAPI.tasks.insert({
      tasklist: taskList.id,
      requestBody: {
        title: task.title,
        notes: task.description,
        due: noDateLimit
          ? ""
          : task.date_todo == null
          ? ""
          : getIsoString(task.date_todo),
      },
    });

    if (res.data.id == null) return { error: "unknownError" };
    return { id: res.data.id };
  } catch (err: any) {
    const errStr: string = err.toString();
    if (errStr.includes("invalid_grant")) return { error: "disconnected" };
    return { error: "unknownError" };
  }
}

type completeTaskRes = "success" | "failure";

/**
 * Complète la tâche dans le calendrier de l'utilisateur
 * @param token Le token Google de l'utilisateur
 * @param task L'ID de la tâche à compléter
 * @returns Le statut (fonctionné/erreur)
 */
export async function completeTask(
  token: string,
  taskID: string
): Promise<completeTaskRes> {
  Log(`Completing task with ID ${taskID}. User token is ${token}`, "DEBUG");
  let auth: OAuth2Client | null = (await tokenToAuth(
    token
  )) as OAuth2Client | null;
  if (auth == null) return "failure";
  const tasksAPI = google.tasks({ version: "v1", auth });
  try {
    const schema = await tasksAPI.tasklists.list();
    if (schema.data.items == null) return "failure";
    const taskList = schema.data.items[0];
    if (taskList.id == null) return "failure";
    const res = await tasksAPI.tasks.patch({
      task: taskID,
      tasklist: taskList.id,
      requestBody: {
        status: "completed",
      },
    });
    if (res.data.status == "completed") {
      Log(`Completed task with TaskID : ${taskID}`, "SUCCESS");
      return "success";
    } else return "failure";
  } catch (err: any) {
    Log(`Couldn't complete task : ${err}`, "ERROR");
    return "failure";
  }
}

export async function uncompleteTask(
  token: string,
  taskID: string
): Promise<completeTaskRes> {
  Log(`Uncompleting task with ID ${taskID}. User token is ${token}`, "DEBUG");

  let auth: OAuth2Client | null = (await tokenToAuth(
    token
  )) as OAuth2Client | null;
  if (auth == null) return "failure";
  const tasksAPI = google.tasks({ version: "v1", auth });
  try {
    const schema = await tasksAPI.tasklists.list();
    if (schema.data.items == null) return "failure";
    const taskList = schema.data.items[0];
    if (taskList.id == null) return "failure";
    const res = await tasksAPI.tasks.patch({
      task: taskID,
      tasklist: taskList.id,
      requestBody: {
        status: "needsAction",
      },
    });
    if (res.data.status == "completed") {
      return "success";
    } else return "failure";
  } catch (err: any) {
    Log(`Couldn't uncomplete task : ${err}`, "ERROR");
    return "failure";
  }
}

type deleteTaskRes = "success" | "failure";

/**
 * Supprime une tâche pour un l'utilisateur
 * @param token Le token google de l'utilisateur
 * @param taskID L'ID google de la tâche à supprimer
 * @returns Le statut (fonctionné/erreur)
 */
export async function deleteGoogleTask(
  token: string,
  taskID: string
): Promise<deleteTaskRes> {
  let auth: OAuth2Client | null = (await tokenToAuth(
    token
  )) as OAuth2Client | null;
  if (auth == null) return "failure";
  const tasksAPI = google.tasks({ version: "v1", auth });
  try {
    const schema = await tasksAPI.tasklists.list();
    if (schema.data.items == null) return "failure";
    const taskList = schema.data.items[0];
    if (taskList.id == null) return "failure";
    await tasksAPI.tasks.delete({
      task: taskID,
      tasklist: taskList.id,
    });
    return "success";
  } catch (err: any) {
    return "failure";
  }
}
