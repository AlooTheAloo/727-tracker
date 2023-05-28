import React, { useEffect, useState } from "react";
import { socket } from "../../../App.js";

interface SideBarItemProps {
  itemName: string;
  collapsed: boolean;
  selected: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}

function SideBarItem(props: SideBarItemProps) {
  const [notifNumber, setNotifNumber] = useState<number>(0);
  const icon = props.icon;

  function getNotifNumber() {
    socket.emit("Application:Notification:GetNotifNumber");
  }

  function createListeners() {
    socket.on("Application:Notification:ReceiveNotifNumber", (notifNumber) => {
      setNotifNumber(notifNumber);
    });
  }

  useEffect(() => {
    if (socket == null) return;
    createListeners();
    getNotifNumber();
  }, []);

  function NotificationNumberIndex() {
    let nbNotification = notifNumber;
    let displayNumber = nbNotification > 9 ? "9+" : nbNotification.toString();
    if (props.itemName == "Notifications" && notifNumber > 0) {
      return (
        <div className="absolute ml-[10px] ">
          <div className="w-4 h-4 bg-red-600 rounded-full flex justify-center">
            <div className="text-[11px] text-slate-100 ">
              <p>{displayNumber}</p>
            </div>
          </div>
        </div>
      );
    } else {
      return null;
    }
  }

  return (
    <div
      className=" w-full flex justify-center"
      onClick={props.onClick}
      style={{ cursor: props.selected ? "auto" : "pointer" }}
    >
      <div
        className={
          "w-4/5 py-2 flex text-[#a9abb0] rounded-xl border-2 " +
          (props.selected
            ? "border-[#272e3a] bg-[#1e2530]"
            : "border-[#0d1520] hover:bg-[#162233] transition-all")
        }
      >
        <div
          className={(props.collapsed ? "mx-4" : "mx-5") + " transition-all"}
        >
          <NotificationNumberIndex />
          {icon}
        </div>
        <p
          style={{ opacity: props.collapsed ? "0" : "1" }}
          className="transition-all pointer-events-none"
        >
          {props.itemName}
        </p>
      </div>
    </div>
  );
}

export default SideBarItem;
