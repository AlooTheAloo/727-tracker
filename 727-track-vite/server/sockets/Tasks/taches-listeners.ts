import dayjs from "dayjs";
import { Socket } from "socket.io";
import { project, task } from "../../../server-client/types.js";
import {
  getGoogleIdFromSocket,
  getTokenFromSocket,
} from "../../Google/google-profile-helper.js";
import {
  addGoogleTask,
  deleteGoogleTask,
} from "../../Google/google-tasks-helper.js";
import {
  getAllProjectAdmin,
  getAllProjects,
  getProjectTasks,
} from "../../utils/DataBase/project-data.js";
import {
  createNewTask,
  getAllTaskAdmin,
  getAllTasks,
} from "../../utils/DataBase/task-data.js";
import { isAdminFromSocket } from "../../utils/admin.js";

/**
 * Crée tous les listeners pour la page "Tâches"
 * @param socket The socket client à écouter
 */
export function runTacheListeners(socket: Socket) {
  socket.on("Application:Taches:GetProjects", async () => {
    const id = getGoogleIdFromSocket(socket);
    const admin = await isAdminFromSocket(socket);
    let projects: project[] | null;
    if (admin) {
      projects = await getAllProjectAdmin();
    } else {
      projects = await getAllProjects(id);
    }
    socket.emit("Application:Taches:ReceiveProjects", projects);
  });

  socket.on("Application:Taches:GetTasks", async () => {
    const admin = await isAdminFromSocket(socket);
    let tasks: task[] | null;
    if (admin) {
      tasks = await getAllTaskAdmin();
    } else {
      tasks = await getAllTasks(getGoogleIdFromSocket(socket), true);
    }
    socket.emit("Application:Taches:ReceiveTasks", tasks);
  });
}
