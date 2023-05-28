import { Socket } from "socket.io";
import { task, user } from "../../../server-client/types.js";
import {
  getGoogleIdFromSocket,
  getUserIDFromSocket,
} from "../../Google/google-profile-helper.js";
import { getProjectUsers } from "../../utils/DataBase/project-data.js";
import { createNewTask } from "../../utils/DataBase/task-data.js";
import { getUserDB } from "../../utils/DataBase/user-data.js";
import { Log } from "../../utils/logging.js";

/**
 * Crée tous les listeners pour la page "Créer tâche"
 * @param socket Le client socket à écouter
 */
export function runCreateListeners(socket: Socket) {
  socket.on(
    "Application:CreateTache:Request:ProjectUsers",
    async (project_ID: number) => {
      if (project_ID == -1) {
        getUserDB(await getUserIDFromSocket(socket)).then((user) => {
          let res = user == null ? [] : [user];
          res = res.map((x) => {
            x.id_google = "";
            x.token_google = "";
            return x;
          });
          socket.emit("Application:CreateTache:Receive:ProjectUsers", res);
        });
      } else {
        getProjectUsers(project_ID).then((res) => {
          if (res == null) res = [];
          res = res.map((x) => {
            x.id_google = "";
            x.token_google = "";
            return x;
          });
          socket.emit("Application:CreateTache:Receive:ProjectUsers", res);
        });
      }
    }
  );

  socket.on(
    "Application:CreateTache:CreateTache",
    async (
      title: string,
      description: string,
      due_date: string | undefined,
      collaborators: user[],
      projectID: number | undefined
    ) => {
      Log("creating task with date : " + due_date);
      if (due_date != undefined) Log("Date is then : " + new Date(due_date));

      const taskCreated = await createNewTask(
        title,
        description,
        due_date == undefined ? undefined : new Date(due_date),
        collaborators,
        await getUserIDFromSocket(socket),
        projectID
      );

      socket.emit("Application:CreateTache:CreatedTache", taskCreated, title);
    }
  );
}
