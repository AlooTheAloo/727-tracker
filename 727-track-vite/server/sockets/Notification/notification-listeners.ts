import dayjs from "dayjs";
import { Socket } from "socket.io";
import { Log } from "../../utils/logging.js";
import { getUserIDFromSocket } from "../../Google/google-profile-helper.js";
import {
  addNotification,
  deleteNotification,
  getNumberUnseenNotification,
  getUnseenNotification,
  getUserNotification,
  seeNotification,
} from "../../utils/DataBase/MongoDB/notification-data.js";
import { user } from "../../../server-client/types.js";

/**
 * Crée tous les listeners pour la page "Notification"
 * @param socket The socket client à écouter
 */
export function runNotifListeners(socket: Socket) {
  socket.on("Application:Notification:GetNotifs", async () => {
    const id_user = await getUserIDFromSocket(socket);
    const notifs = await getUserNotification(id_user);
    socket.emit("Application:Notification:ReceiveNotifs", notifs);
  });
  socket.on("Application:Notification:AddNotif", async (description) => {
    const id_user = await getUserIDFromSocket(socket);
    await addNotification(description, id_user);
    socket.emit("Application:Notification:GetNotifNumber");
  });
  socket.on(
    "Application:Notification:AddNotifWithUser",
    async (description: string, id_user: string) => {
      await addNotification(description, id_user);
      socket.emit("Application:Notification:GetNotifNumber");
    }
  );
  socket.on("Application:Notification:DeleteNotif", async (notif_id:string) => {
    await deleteNotification(notif_id);
    socket.emit("Application:Notification:NotifDeleted");
  });
  socket.on("Application:Notification:SeeNotif", async (notif_id:string) => {
    await seeNotification(notif_id);
    socket.emit("Application:Notification:NotifSeen");
  });
  socket.on("Application:Notification:GetNotifNumber", async () => {
    const user_id = await getUserIDFromSocket(socket);
    const notifNumber = (await getUnseenNotification(user_id)).length;
    socket.emit("Application:Notification:ReceiveNotifNumber", notifNumber);
  });
}
