import React, { useEffect, useState } from "react";
import { socket } from "../../App.js";
import SideBar, { SideBarOptions } from "../../Components/Global/SideBar.js";
import { useNavigate, useParams } from "react-router-dom";
import { task, user } from "../../../server-client/types.js";
import { Button, notification, Skeleton } from "antd";
import SpecificTaskSkeleton from "../../Components/Taches/TacheSpec/SpecificTaskSkeleton.js";
import { RenderedTask } from "../../Components/Taches/TacheSpec/RenderedTask.js";
import { NotificationInstance } from "antd/es/notification/interface";
import { notificationData } from "../../utils/frontend-types";
import { generateNotification } from "../../utils";

function SpecificTask() {
  const [api, contextHolder] = notification.useNotification();
  const { id } = useParams();
  const [task, setTask] = useState<task>();
  const [affectedBy, setAffectedBy] = useState<string>();
  const [isTaskOwner, setIsTaskOwner] = useState<boolean>(false);
  const [users, setUsers] = useState<user[]>([]);
  const [collaborators, setCollaborators] = useState<user[]>([]);

  function getTacheInfo() {
    socket.emit("Application:TacheSpec:GetTaskById", id);
  }

  useEffect(() => {
    const taskData: string | null = localStorage.getItem("showNotification");
    if (taskData != null) {
      const parsedTaskData: notificationData = JSON.parse(taskData);
      generateNotification(api, parsedTaskData);
    }
    localStorage.removeItem("showNotification");

    socket.on(
      "Application:TacheSpec:ReceiveTaskById",
      (
        task: task | null,
        isOwner: boolean,
        users: user[],
        collaborators: user[],
        affectedBy?: string
      ) => {
        if (task == null) {
          setTask({
            id_task: -1,
            title: "Tâche introuvable",
          } as task);
          return;
        }

        setCollaborators(collaborators);
        setUsers(users);
        setTask(task);
        setAffectedBy(affectedBy);
        setIsTaskOwner(isOwner);
      }
    );
    getTacheInfo();
  }, []);

  return (
    <div className="flex w-screen ">
      {contextHolder}
      <SideBar selectedOption={SideBarOptions.None} />
      <div className="flex-grow flex flex-col h-full items-center">
        <div className="w-11/12 mt-12 mb-6 h-5 flex justify-center items-center flex-col">
          <div
            style={{
              display: task == undefined ? "flex" : "none",
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

          <p className="text-4xl font-semibold text-center">{task?.title}</p>
          <p>
            {task == null ? "" : task?.id_task == -1 ? "" : "Affectée par"}{" "}
            {affectedBy}
          </p>
        </div>
        <div className="flex flex-col flex-wrap justify-center  bg-[#E9E9E9]  border-[#707070] border-2 w-11/12 min-h-[35rem] rounded-lg overflow-x-hidden content-start mt-[5.75rem]">
          <RenderTaskIfExist
            api={api}
            task={task}
            isTaskOwner={isTaskOwner}
            users={users}
            collaborators={collaborators}
            setCollaborators={setCollaborators}
          />
        </div>
      </div>
    </div>
  );
}

interface renderTaskIfExistProps {
  task: task | undefined;
  isTaskOwner: boolean;
  users: user[];
  collaborators: user[];
  api: NotificationInstance;
  setCollaborators: React.Dispatch<React.SetStateAction<user[]>>;
}

const RenderTaskIfExist = (props: renderTaskIfExistProps) => {
  const navigate = useNavigate();

  if (props.task == null) {
    return <SpecificTaskSkeleton />;
  } else if (props.task?.id_task != -1)
    return (
      <RenderedTask
        setCollaborators={props.setCollaborators}
        api={props.api}
        task={props.task}
        isTaskOwner={props.isTaskOwner}
        users={props.users}
        collaborators={props.collaborators}
      />
    );
  else {
    return (
      <div className="w-full flex flex-col items-center gap-5">
        <h1 className="text-xl font-bold">
          Cette tâche n'existe pas ou vous n'y avez pas accès
        </h1>
        <div>
          <Button
            type="primary"
            onClick={() => {
              navigate("/tasklist");
            }}
          >
            Retour
          </Button>
        </div>
      </div>
    );
  }
};

export default SpecificTask;
