import React, { useEffect, useState } from "react";
import { socket } from "../../App.js";
import SideBar, { SideBarOptions } from "../../Components/Global/SideBar.js";
import NotifListNotif from "../../Components/Notifications/notifListNotif.js";
import { notification } from "../../../server-client/types.js";
import { Skeleton, Spin } from "antd";

function Notifications() {
  const [notifs, setNotifs] = useState<notification[] | undefined>(undefined);

  function getNotifs() {
    socket.emit("Application:Notification:GetNotifs");
  }

  function createListeners() {
    socket.on("Application:Notification:ReceiveNotifs", (notifs) => {
      notifs = notifs.sort((a: notification, b: notification) => {
        const c: notification = { ...a };
        const d: notification = { ...b };
        return Number.parseInt(c.isSeen) - Number.parseInt(d.isSeen);
      });
      setNotifs(notifs);
      socket.emit("Application:Notification:GetNotifNumber");
    });
    socket.on("Application:Notification:NotifDeleted", () => {
      getNotifs();
      socket.emit("Application:Notification:GetNotifNumber");
    });
    socket.on("Application:Notification:NotifSeen", () => {
      getNotifs();
      socket.emit("Application:Notification:GetNotifNumber");
    });
  }

  function handleNotifDelete(id_notif: string) {
    socket.emit("Application:Notification:DeleteNotif", id_notif);
  }

  function handleNotifSeen(id_notif: string) {
    socket.emit("Application:Notification:SeeNotif", id_notif);
  }

  useEffect(() => {
    if (socket == null) return;
    createListeners();
    getNotifs();
  }, []);

  function NotifsList() {
    if (notifs == undefined) {
      return (
        

        <div className="w-[96%] ml-[2%]">
          {Array.apply(null, Array(4)).map((x, i) => {
            return (
              <Skeleton.Button
                key={i}
                active
                className="mt-2"
                block
                style={{ height: "3rem" }}
              />
            );
          })}
        </div>
      );
    } else {
      if (notifs.length > 0) {
        return (
          <div className="overflow-y-scroll">
            {notifs.map((notif, index) => {
              return (
                <div className=" m-2" key={index}>
                  <NotifListNotif
                    id={notif.id_notification}
                    title={notif.title}
                    isSeen={notif.isSeen}
                    handleNotifDelete={handleNotifDelete}
                    handleNotifSeen={handleNotifSeen}
                  />
                </div>
              );
            })}
          </div>
        );
      } else
        return (
          <div className="flex flex-col h-full flex-grow justify-center">
            <div>
              <p className="w-full h-full text-center font-semibold text-2xl">
                {" "}
                Rien à signaler!{" "}
              </p>
              <p className="w-full h-full text-center -mt-3">
                {" "}
                Vos notifications apparaisseront ici{" "}
              </p>
            </div>
          </div>
        );
    }
  }

  return (
    <>
      <div className="flex w-screen ">
        <SideBar selectedOption={SideBarOptions.Notifications} />
        <div className="flex-grow flex flex-col h-full items-center">
          <h1 className="w-11/12 text-4xl my-6 font-semibold text-center mb-[7.5rem]">
            Notifications
          </h1> 
          <div
            className={
              "flex flex-col bg-[#E9E9E9]  border-[#707070] border-2 w-11/12 h-[35rem] rounded-lg overflow-x-hidden content-start "
            }
          >
            <NotifsList />
          </div>
        </div>
      </div>
    </>
  );
}

export default Notifications;
