import { Server, Socket } from "socket.io";
import { runLoginListeners } from "./Misc/login-listeners.js";
import { runTacheListeners } from "./Tasks/taches-listeners.js";
import { runTacheSpecifiqueListeners } from "./Tasks/tachespecifique-listeners.js";
import { runProjetsListeners } from "./Projects/projets-listeners.js";
import { runSideBarListeners } from "./Misc/sidebar-listeners.js";
import { runCreateListeners } from "./Tasks/create-tache-listeners.js";
import { runAdminListeners } from "./Misc/admin-listeners.js";
import { runOrganisationListeners } from "./organisations/organisation-listeners.js";
import { runEventsListeners } from "./events/events-listeners.js";
import { runNotifListeners } from "./Notification/notification-listeners.js";

export function createSocketServer(io: Server) {
  io.on("connection", (socket: Socket) => {
    runProjetsListeners(socket);

    runTacheListeners(socket);

    runTacheSpecifiqueListeners(socket);

    runLoginListeners(socket);

    runSideBarListeners(socket);

    runCreateListeners(socket);

    runOrganisationListeners(socket);

    runAdminListeners(socket);

    runNotifListeners(socket);

    runEventsListeners(socket);

    runNotifListeners(socket);
  });
}
