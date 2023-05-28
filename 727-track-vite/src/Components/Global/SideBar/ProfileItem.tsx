import { Avatar, Button, Skeleton } from "antd";
import { ImportOutlined } from "@ant-design/icons";

import React from "react";
import { socket } from "../../../App.js";
import { NavigateFunction, useNavigate } from "react-router-dom";
import cookieParser from "cookie-parser";

interface ProfileItemProps {
  collapsed: boolean;
  pfp?: string;
  name?: string;
}
let navigate: NavigateFunction;
function ProfileItem(props: ProfileItemProps) {
  navigate = useNavigate();
  return (
    <div className="h-20 flex items-center gap-5 w-72">
      <div
        className={
          "transition-all h-full flex justify-center items-center  " +
          (props.collapsed ? "ml-2" : "ml-4")
        }
      >
        <img
          src={props.pfp == undefined ? "" : `${props.pfp}`}
          className={"w-12 h-12 rounded-xl border-white border-2px "}
          referrerPolicy="no-referrer"
        ></img>
      </div>
      <div className="flex flex-col">
        <div
          className={
            (props.collapsed ? "opacity-0" : "opacity-100") +
            "  transition-all duration-200 pointer-events-none w-44"
          }
        >
          <p className="text-white overflow-ellipsis overflow-hidden whitespace-nowrap leading-6 h-6">
            {props.name == undefined ? "" : props.name}
          </p>
        </div>
        <div
          className={
            (props.collapsed
              ? "opacity-0 pointer-events-none"
              : "opacity-100 pointer-events-auto") +
            "  transition-all duration-200"
          }
        >
          <Button danger type="primary" size="small" onClick={handleDisconnect}>
            <ImportOutlined />
            Déconnexion
          </Button>
        </div>
      </div>
    </div>
  );
}

function handleDisconnect() {
  // https://www.tutorialspoint.com/How-to-clear-all-cookies-with-JavaScript
  try {
    var Cookies = document.cookie.split(";");

    // set 1 Jan, 1970 expiry for every cookies
    for (let i = 0; i < Cookies.length; i++) {
      document.cookie = Cookies[i] + "=;expires=" + new Date(0).toUTCString();
    }

    socket.emit("Application:Login:Disconnect");
  } catch (e) {
    console.log(e);
    alert("Oh boy : " + e);
    //window.location.href = "/login";
  }
}

export default ProfileItem;
