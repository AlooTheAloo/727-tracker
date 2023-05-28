import { Button, Modal, notification, Steps, Tooltip } from "antd";
import { NotificationInstance } from "antd/es/notification/interface";
import dayjs from "dayjs";
import React, { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  project,
  status,
  task,
  user,
} from "../../../../server-client/types.js";
import { socket } from "../../../App.js";
import { generateNotification, StoreNotification } from "../../../utils/index";
import { notificationData } from "../../../utils/frontend-types.js";
import TacheDataDisplay from "../../Taches/TacheSpec/TacheDataDisplay.js";
import ProjectDataDisplay from "./ProjectDataDisplay.js";
import { addNotification } from "../../../../server/utils/DataBase/MongoDB/notification-data.js";

interface RenderedProjectProps {
  project: project | undefined;
  isProjectOwner: boolean;
  users: user[];
  collaborators: user[];
  api: NotificationInstance;
}

const statusToCurrent = (status: status) => {
  console.log("status : " + status);
  switch (status) {
    case "Waiting":
      return 0;
    case "In Progress":
      return 1;
    case "Completed":
      return 3;
  }
};

export function RenderedProject(props: RenderedProjectProps) {
  const [wasModified, setWasModified] = useState<boolean>(false);
  const [limitDate, setLimitDate] = useState<Date | undefined>(
    props.project?.date_todo
  );
  const [description, setDescription] = useState<string | undefined>(
    props.project?.description
  );
  const [collaborators, setCollaborators] = useState<user[] | undefined>(
    props.collaborators
  );
  const [awaitingServer, setAwaitingServer] = useState<boolean>(false);
  const [awaitingServerRed, setAwaitingServerRed] = useState<boolean>(false);
  const [awaitingServerDelete, setAwaitingServerDelete] =
    useState<boolean>(false);

  const { confirm } = Modal;

  const showConfirm = (callback: () => void, content: string) => {
    confirm({
      title: "Confirmer modification de progrès",
      content: content,
      okText: "Continuer",
      okType: "danger",
      cancelText: "Annuler",
      onOk() {
        callback();
      },
    });
  };

  const onSave = () => {
    setAwaitingServer(true);
    console.log(JSON.stringify(collaborators));
    socket.emit(
      "Application:Project:ModifyProject",
      props.project?.id_project,
      props.project?.title,
      limitDate,
      description,
      collaborators
    );
  };

  const onStartTask = () => {
    setAwaitingServer(true);
    socket.emit(
      "Application:Project:SetProjectStatus",
      props.project?.id_project,
      "In Progress"
    );
  };

  const onCompleteTask = () => {
    setAwaitingServer(true);
    socket.emit(
      "Application:Project:SetProjectStatus",
      props.project?.id_project,
      "Completed"
    );
  };

  const onUnCompleteTask = () => {
    setAwaitingServer(true);
    socket.emit(
      "Application:Project:SetProjectStatus",
      props.project?.id_project,
      "In Progress"
    );
  };

  const onUnstartTask = () => {
    setAwaitingServer(true);
    setAwaitingServerRed(true);
    socket.emit(
      "Application:Project:SetProjectStatus",
      props.project?.id_project,
      "Waiting"
    );
  };
  const onDeleteProject = () => {
    setAwaitingServer(true);
    setAwaitingServerDelete(true);
    socket.emit("Application:Project:DeleteProject", props.project?.id_project);
    navigate("/projectlist");
  };

  useEffect(() => {
    socket.on(
      "Application:Project:Modification:ServerReply",
      (status: boolean) => {
        if (status) {
          StoreNotification(
            {
              title: "Projet modifié avec succès",
              description: `Projet "${props.project?.title}" modifié avec succès`,
              status: "success",
            },
            () => {
              window.location.href = window.location.href;
            }
          );
        } else {
          generateNotification(props.api, {
            title: "Erreur interne",
            description:
              "Le projet n'a pas été modifié. Veuillez réessayer plus tard",
            status: "error",
          });
          setAwaitingServer(false);
          setAwaitingServerRed(false);
        }
      }
    );
  }, []);

  const navigate = useNavigate();

  const createDescription = (date: Date | undefined) => {
    return (
      <p className="text-xs font-light">
        Le {dayjs(date).format("DD-MM-YYYY")}
      </p>
    );
  };

  const project = props.project;
  let taskRender = <div></div>;
  if (project != undefined) {
    const current = statusToCurrent(project?.status);
    taskRender = (
      <div className="flex-grow w-full flex flex-col">
        <div className="flex flex-grow w-full h-full">
          <div className="md:w-3/4 w-full flex">
            <div className="flex-grow h-full md:ml-20 md:mx-0 mx-5">
              <ProjectDataDisplay
                selectedCollaborators={collaborators ?? []}
                users={props.users}
                collaborators={props.collaborators}
                project={props.project}
                isTaskOwner={props.isProjectOwner}
                onChangeDate={(date) => {
                  setWasModified(true);
                  setLimitDate(date);
                }}
                onChangeCollaborators={(collaborators) => {
                  setWasModified(true), setCollaborators(collaborators);
                }}
                onChangeDescription={(description) => {
                  setWasModified(true);
                  setDescription(description);
                }}
              />
            </div>
          </div>

          <div className="w-1/4 md:block hidden">
            <Steps
              direction="vertical"
              current={current}
              className={"h-[30rem] w-[25.5vw] absolute mt-14"}
              items={[
                {
                  title: "Créé",
                  description: createDescription(project.date_created),
                },
                {
                  title: "Commencé",
                  description:
                    current > 0 ? createDescription(project.date_created) : "",
                },
                {
                  title: "Terminé",
                  description:
                    current > 1 ? createDescription(project.date_end) : "",
                },
              ]}
            ></Steps>
          </div>
        </div>
        <hr className="border-[#707070] mx-5 md:mx-20" />
        <div
          className={
            "flex lg:flex-row flex-col justify-center lg:gap-2 items-center h-[7.5rem] mx-5 md:mx-20 "
          }
        >
          <Tooltip
            title={
              wasModified && collaborators?.length == 0
                ? "Ajoutez des collaborateurs pour sauvegarder!"
                : null
            }
          >
            <Button
              danger={project.status == "Completed" && !wasModified}
              disabled={
                awaitingServer || (wasModified && collaborators?.length == 0)
              }
              loading={awaitingServer && !awaitingServerRed}
              type="primary"
              className={
                "lg:mt-0 mt-1.5 " + (props.isProjectOwner ? "" : "hidden")
              }
              onClick={() => {
                wasModified
                  ? onSave()
                  : project.status == "Completed"
                  ? showConfirm(
                      onUnCompleteTask,
                      `Voulez-vous vraiment marquer '${project.title}' comme non-complété?`
                    )
                  : project.status == "Waiting"
                  ? onStartTask()
                  : onCompleteTask();
              }}
            >
              {wasModified
                ? "Sauvegarder"
                : project.status == "Completed"
                ? "Marquer comme non-terminé"
                : project.status == "Waiting"
                ? "Marquer comme commencé"
                : "Marquer comme terminé"}
            </Button>
          </Tooltip>

          <Button
            onClick={() => {
              showConfirm(
                onUnstartTask,
                `Voulez-vous vraiment réinitialiser l'état de '${project.title}'?`
              );
            }}
            disabled={awaitingServer}
            loading={awaitingServerRed}
            danger
            type="primary"
            className={
              project.status == "In Progress" ? "lg:mt-0 mt-1.5" : "hidden"
            }
          >
            Réinitialiser état du projet
          </Button>

          <Button
            danger
            type="primary"
            className="md:mt-0 mt-1.5"
            onClick={() => {
              showConfirm(
                onDeleteProject,
                `Voulez-vous vraiment supprimer '${project.title}'?`
              );
            }}
            disabled={awaitingServer}
            loading={awaitingServerDelete}
          >
            Supprimer
          </Button>
          <Button
            type={props.isProjectOwner ? "default" : "primary"}
            onClick={() => {
              navigate("/tasklist", {
                state: { projectID: props.project?.id_project },
              });
            }}
            disabled={awaitingServer || awaitingServerRed}
          >
            Voir tâches
          </Button>

          <Button
            disabled={awaitingServer}
            onClick={() => {
              navigate("/projectList");
            }}
            className="lg:mt-0 mt-1"
          >
            Retour
          </Button>
        </div>
      </div>
    );
  }
  return taskRender;
}
