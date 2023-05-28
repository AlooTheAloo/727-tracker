import React from "react";
import { socket } from "../../App.js";
import WelcomeScreen from "../../Components/Login/WelcomeScreen.js";
import LoginSwipeScreen from "../../Components/Login/LoginSwipeScreen.js";
function Login() {
  function handleConnection() {
    socket.emit("Application:Login:LoginRequest");
  }

  return (
    <div className="flex flex-row w-screen bg-white h-full">
      <div className="w-full">
        <WelcomeScreen handleConnection={handleConnection} />
      </div>
      <div className="hidden md:block w-full h-full bg-login">
        <div className="h-screen min-h-[40em] flex items-center justify-center">
          <LoginSwipeScreen></LoginSwipeScreen>
        </div>
      </div>
    </div>
  );
}

export default Login;
