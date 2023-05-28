import { Socket } from "socket.io";
import { task } from "../../../server-client/types.js";
import { getGoogleIdFromSocket } from "../../Google/google-profile-helper.js";
import {
  getUserDB,
  getUserDBfromGoogleID,
} from "../../utils/DataBase/user-data.js";

/**
 * Crée tous les listeners pour la sideabr
 * @param socket The socket client à écouter
 */
export function runSideBarListeners(socket: Socket) {
  socket.on("Application:Sidebar:GetUserInfo", async () => {
    let data = await getUserDBfromGoogleID(getGoogleIdFromSocket(socket));
    if (data == null) return;

    // no need to send this data, it would be a waste of bandwidth and probably insecure
    data.token_google = "";
    data.id_google = "";

    socket.emit("Application:Sidebar:ReceiveUserInfo", data);
  });
}
