import { Socket } from "socket.io";
import { generateAuthUrl } from "../../Google/google-profile-helper.js";

export function runLoginListeners(socket: Socket) {
  socket.on("Application:Login:LoginRequest", () => {
    const auth = generateAuthUrl();
    socket.emit("Application:Redirect", auth);
  });

  socket.on("Application:Login:Disconnect", () => {
    // Handle client disconnection if needed
    socket.emit("Application:Redirect", "/login");
  });
}
