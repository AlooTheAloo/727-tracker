import { Socket } from "socket.io";
import { getUserIDFromSocket } from "../Google/google-profile-helper.js";
import { getAdmin } from "./DataBase/MongoDB/admin-data.js";
import { Log } from "./logging.js";

export async function isAdminFromSocket(socket: Socket) {
  const id = await getUserIDFromSocket(socket);
  if (id == "") {
    Log("Failed to get admin", "ERROR");
    return false;
  }
  // Figure out if ID is an admin
  const admin = await getAdmin(id.toString());
  if (admin) {
    if (admin.id_user == id.toString()) {
      return true;
    }
  }
  return false;
}
