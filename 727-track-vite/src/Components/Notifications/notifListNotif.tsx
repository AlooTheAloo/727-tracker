import React, { useEffect, useState } from "react";
import { CalendarOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { Button, Space } from "antd";
import { CloseOutlined } from "@ant-design/icons";

interface NotifProp {
  id: string;
  title: string;
  handleNotifDelete: (id_notif: string) => void;
  handleNotifSeen: (id_notif: string) => void;
  isSeen: string;
}

function NotifListNotif(props: NotifProp) {
  return (
    <>
      <div
        onClick={() => {
          if(props.isSeen == "1") return; // No need to seen again
          props.handleNotifSeen(props.id);
        }}
        className="mt-4 z-0 ml-1 bg-white rounded-lg hover:bg-gray-200 hover:cursor-pointer transition-colors flex items-center"
      >
        <div className=" w-11/12 min-w-0 flex-shrink">
          <p className="font-bold ml-4 leading-[3rem] text-ellipsis whitespace-nowrap overflow-hidden max-w-[54vw] sm:max-w-[60vw] md:max-w-[70vw] lg:max-w-[80vw] ">
            {props.title}
          </p>
        </div>
        <div className="w-1/12 min-w-0">
          <div className=" items-center float-right mr-4">
            <Button
              className="ml-4"
              onClick={() => {
                props.handleNotifDelete(props.id);
              }}
            >
              <CloseOutlined />
            </Button>
          </div>
        </div>
      </div>

      <div
        className={
          (props.isSeen == "0" ? "" : "hidden") +
          "bg-red-500 z-10 -mt-14 w-4 h-4 rounded-full"
        }
      ></div>

      <div className="mt-14"></div>
    </>
  );
}

export default NotifListNotif;
