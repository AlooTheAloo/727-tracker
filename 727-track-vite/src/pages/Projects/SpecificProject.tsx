import React, { useEffect, useState } from "react";
import { socket } from "../../App.js";
import SideBar, { SideBarOptions } from "../../Components/Global/SideBar.js";
import { useNavigate, useParams } from "react-router-dom";
import { project, task, user } from "../../../server-client/types.js";
import { Button, notification, Skeleton } from "antd";
import SpecificTaskSkeleton from "../../Components/Taches/TacheSpec/SpecificTaskSkeleton.js";
import { RenderedTask } from "../../Components/Taches/TacheSpec/RenderedTask.js";
import { NotificationInstance } from "antd/es/notification/interface";
import { notificationData } from "../../utils/frontend-types";
import { generateNotification } from "../../utils";
import { RenderedProject } from "../../Components/Projets/ProjectSpec/RenderedProject.js";

function SpecificProject() {
  const [api, contextHolder] = notification.useNotification();
  const { id } = useParams();
  const [project, setProject] = useState<project>();
  const [affectedBy, setAffectedBy] = useState<string>();
  const [isProjectOwner, setIsProjectOwner] = useState<boolean>(false);
  const [users, setUsers] = useState<user[]>([]);
  const [collaborators, setCollaborators] = useState<user[]>([]);

  function getTacheInfo() {
    socket.emit("Application:ProjectSpec:GetProjectByID", id);
  }

  useEffect(() => {
    const taskData: string | null = localStorage.getItem("showNotification");
    if (taskData != null) {
      const parsedTaskData: notificationData = JSON.parse(taskData);
      generateNotification(api, parsedTaskData);
    }
    localStorage.removeItem("showNotification");

    socket.on(
      "Application:ProjectSpec:ReceiveProjectByID",
      (
        project: project | null,
        isOwner: boolean,
        users: user[],
        collaborators: user[],
        affectedBy?: string
      ) => {
        if (project == null) {
          setProject({
            id_project: -1,
            title: "Projet introuvable",
          } as project);
          return;
        }

        setCollaborators(collaborators);
        setUsers(users);
        setProject(project);
        setAffectedBy(affectedBy);
        setIsProjectOwner(isOwner);
      }
    );
    getTacheInfo();
  }, []);

  return (
    <div className="flex w-screen ">
      {contextHolder}
      <SideBar selectedOption={SideBarOptions.None} />
      <div className="flex-grow flex flex-col h-full items-center">
        <div className="w-4/5 mt-12 mb-6 h-5 flex justify-center items-center flex-col">
          <div
            style={{
              display: project == undefined ? "flex" : "none",
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

          <p className="text-4xl font-semibold text-center">{project?.title}</p>
          <p>
            {project == null
              ? ""
              : project?.id_project == -1
              ? ""
              : "Affecté par"}{" "}
            {affectedBy}
          </p>
        </div>
        <div className="flex flex-col flex-wrap justify-center  bg-[#E9E9E9]  border-[#707070] border-2 w-11/12 min-h-[35rem] rounded-lg overflow-x-hidden content-start mt-[5.75rem]">
          <RenderProjectIfExist
            api={api}
            project={project}
            isProjectOwner={isProjectOwner}
            users={users}
            collaborators={collaborators}
          />
        </div>
      </div>
    </div>
  );
}

interface renderProjectIfExistProps {
  project: project | undefined;
  isProjectOwner: boolean;
  users: user[];
  collaborators: user[];
  api: NotificationInstance;
}

const RenderProjectIfExist = (props: renderProjectIfExistProps) => {
  const navigate = useNavigate();

  if (props.project == null) {
    return <SpecificTaskSkeleton />;
  } else if (props.project?.id_project != -1)
    return (
      <RenderedProject
        api={props.api}
        project={props.project}
        isProjectOwner={props.isProjectOwner}
        users={props.users}
        collaborators={props.collaborators}
      />
    );
  else {
    return (
      <div className="w-full flex flex-col items-center gap-5">
        <h1 className="text-xl font-bold">
          Ce projet n'existe pas ou vous n'y avez pas accès
        </h1>
        <div>
          <Button
            type="primary"
            onClick={() => {
              navigate("/projectlist");
            }}
          >
            Retour
          </Button>
        </div>
      </div>
    );
  }
};

export default SpecificProject;
