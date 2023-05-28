import { event } from "../../server-client/types.js";
import { OAuth2Client } from "google-auth-library";
import { tokenToAuth } from "./google-profile-helper.js";
import { books_v1, google } from "googleapis";
import { Log } from "../utils/logging.js";

interface addEventRes {
  error?: "disconnected" | "insufficientPermissions" | "unknownError";
  id?: string | null | undefined;
}

/**
 * Ajoute un evenement dans le calendrier google d'un utilisateur
 * @param token Le token d'identification google de l'utilisateur
 * @param event L'événement à ajouter
 * @returns Une promesse qui résout avec un objet contenant une erreur ou l'id google de la tâche si tout fonctionne
 */
export async function addGoogleEvent(
  token: string,
  event: event
): Promise<addEventRes> {
  let auth: OAuth2Client | null = (await tokenToAuth(
    token
  )) as OAuth2Client | null;
  if (auth == null) return { error: "disconnected" };
  const calendar = google.calendar({ version: "v3", auth });
  try {
    const evt = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: event.title,
        start: {
          dateTime: event.date_start,
        },
        end: {
          dateTime: event.date_end,
        },
      },
    });
    return { id: evt.data.id };
  } catch (err: any) {
    Log(`Google error : ${err}`, "ERROR");
    if (err.errors[0].reason === "insufficientPermissions") {
      return { error: "insufficientPermissions" };
    } else {
      return { error: "unknownError" };
    }
  }
}

/**
 * Supprime un événement pour un l'utilisateur
 * @param token Le token google de l'utilisateur
 * @param eventID L'ID google de la tâche à supprimer
 * @returns Le statut (fonctionné/erreur)
 */
export async function deleteGoogleEvent(
  token: string,
  eventID: string
): Promise<boolean> {
  let auth: OAuth2Client | null = (await tokenToAuth(
    token
  )) as OAuth2Client | null;
  if (auth == null) return false;
  const calendar = google.calendar({ version: "v3", auth });
  try {
    await calendar.events.delete({ calendarId: "primary", eventId: eventID });
    return true;
  } catch (err: any) {
    Log(err, "ERROR");
    return false;
  }
}
