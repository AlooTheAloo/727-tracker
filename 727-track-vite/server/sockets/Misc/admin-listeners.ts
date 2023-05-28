import { Socket } from "socket.io";
import { getAdmin } from "../../utils/DataBase/MongoDB/admin-data.js";
import { Log } from "../../utils/logging.js";
import { isAdminFromSocket } from "../../utils/admin.js";

export function runAdminListeners(socket: Socket) {
  socket.on("Application:Admin:CheckCurrentUserAdmin", async () => {
    const admin = await isAdminFromSocket(socket);
    socket.emit("Application:Admin:ReceiveCurrentUserAdmin", admin);
  });

  //NO NEED TO EMIT BACK TO DELETE. JUST DELETE FROM THE SOCKET.ON
}
