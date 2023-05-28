import React, { useEffect, useState } from "react";
import { socket } from "../../App.js";
import SideBar, { SideBarOptions } from "../../Components/Global/SideBar.js";
import { useNavigate, useParams } from "react-router-dom";
import { event, task, user } from "../../../server-client/types.js";
import { Button, notification, Skeleton } from "antd";
import SpecificTaskSkeleton from "../../Components/Taches/TacheSpec/SpecificTaskSkeleton.js";
import { RenderedTask } from "../../Components/Taches/TacheSpec/RenderedTask.js";
import { NotificationInstance } from "antd/es/notification/interface";
import { notificationData } from "../../utils/frontend-types";
import { generateNotification } from "../../utils";
import { RenderedEvent } from "../../Components/Events/SpecificEvent/RenderedEvent.js";

function SpecificEvent() {
  const [api, contextHolder] = notification.useNotification();
  const { id } = useParams();
  const [event, setEvent] = useState<event>();
  const [projectTitle, setProjectTitle] = useState<string>();
  const [users, setUsers] = useState<user[]>([]);
  const [collaborators, setCollaborators] = useState<user[]>([]);

  function getEventInfo() {
    socket.emit("Application:EventSpec:GetEventByID", id);
  }

  useEffect(() => {
    const taskData: string | null = localStorage.getItem("showNotification");
    if (taskData != null) {
      const parsedNotification: notificationData = JSON.parse(taskData);
      generateNotification(api, parsedNotification);
    }
    localStorage.removeItem("showNotification");

    socket.on(
      "Application:EventSpec:ReceiveEventById",
      (
        event: event | null,
        users: user[],
        collaborators: user[],
        project_title: string
      ) => {
        console.log("Received event");
        if (event == null) {
          setEvent({
            id_event: -1,
            title: "Événement introuvable",
          } as event);
          return;
        }

        setCollaborators(collaborators);
        setUsers(users);
        setEvent(event);
        setProjectTitle(project_title);
        console.log(project_title);
      }
    );
    getEventInfo();
  }, []);

  return (
    <div className="flex w-screen ">
      {contextHolder}
      <SideBar selectedOption={SideBarOptions.None} />
      <div className="flex-grow flex flex-col h-full items-center">
        <div className="w-11/12 mt-12 mb-6 h-5 flex justify-center items-center flex-col">
          <div
            style={{
              display: event == undefined ? "flex" : "none",
              width: "100%",
            }}
            className="flex-col items-center"
          >
            <Skeleton.Button
              style={{ width: "100%" }}
              active
              block
            ></Skeleton.Button>
            <div className="w-1/5">
              <Skeleton.Button
                style={{ width: "100%" }}
                active
                block
              ></Skeleton.Button>
            </div>
          </div>

          <p className="text-4xl font-semibold text-center">{event?.title}</p>
          <p> {projectTitle} </p>
        </div>
        <div className="flex flex-col flex-wrap justify-center  bg-[#E9E9E9]  border-[#707070] border-2 w-11/12 min-h-[35rem] rounded-lg overflow-x-hidden content-start mt-[5.75rem]">
          <RenderEventIfExist
            api={api}
            event={event}
            users={users}
            collaborators={collaborators}
            setCollaborators={setCollaborators}
          />
        </div>
      </div>
    </div>
  );
}

interface renderEventIfExistProps {
  event: event | undefined;
  users: user[];
  collaborators: user[];
  api: NotificationInstance;
  setCollaborators: React.Dispatch<React.SetStateAction<user[]>>;
}

const RenderEventIfExist = (props: renderEventIfExistProps) => {
  const navigate = useNavigate();

  if (props.event == null) {
    return <SpecificTaskSkeleton />;
  } else if (props.event?.id_event != -1)
    return (
      <RenderedEvent
        setCollaborators={props.setCollaborators}
        api={props.api}
        event={props.event}
        users={props.users}
        collaborators={props.collaborators}
      />
    );
  else {
    return (
      <div className="w-full flex flex-col items-center gap-5">
        <h1 className="text-xl font-bold">
          Cet événement n'existe pas ou vous n'y avez pas accès
        </h1>
        <div>
          <Button
            type="primary"
            onClick={() => {
              navigate("/events");
            }}
          >
            Retour
          </Button>
        </div>
      </div>
    );
  }
};

export default SpecificEvent;
