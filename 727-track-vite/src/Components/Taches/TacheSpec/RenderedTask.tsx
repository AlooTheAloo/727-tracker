import { Button, Modal, notification, Steps, Tooltip } from "antd";
import { NotificationInstance } from "antd/es/notification/interface";
import { DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import React, { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { status, task, user } from "../../../../server-client/types.js";
import { socket } from "../../../App.js";
import { generateNotification, StoreNotification } from "../../../utils/index";
import { notificationData } from "../../../utils/frontend-types.js";
import TacheDataDisplay from "./TacheDataDisplay.js";

interface RenderedTaskProps {
  task: task | undefined;
  isTaskOwner: boolean;
  users: user[];
  collaborators: user[];
  setCollaborators: React.Dispatch<React.SetStateAction<user[]>>;
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

export function RenderedTask(props: RenderedTaskProps) {
  const [wasModified, setWasModified] = useState<boolean>(false);
  const [limitDate, setLimitDate] = useState<Date | undefined>(
    props.task?.date_todo
  );
  const [description, setDescription] = useState<string | undefined>(
    props.task?.description
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
    socket.emit(
      "Application:SpecificTask:ModifyTask",
      props.task?.id_task,
      props.task?.title,
      limitDate,
      description,
      props.collaborators
    );
  };

  const onStartTask = () => {
    setAwaitingServer(true);
    socket.emit("Application:SpecificTask:StartTask", props.task?.id_task);
  };

  const onCompleteTask = () => {
    setAwaitingServer(true);
    socket.emit("Application:SpecificTask:CompleteTask", props.task?.id_task);
  };

  const onUnCompleteTask = () => {
    setAwaitingServer(true);
    socket.emit("Application:SpecificTask:UncompleteTask", props.task?.id_task);
  };

  const onUnstartTask = () => {
    setAwaitingServer(true);
    setAwaitingServerRed(true);
    socket.emit("Application:SpecificTask:UnstartTask", props.task?.id_task);
  };

  const onDeleteTask = () => {
    setAwaitingServer(true);
    setAwaitingServerDelete(true);
    socket.emit("Application:SpecificTask:DeleteTask", props.task?.id_task);
  };

  useEffect(() => {
    socket.on(
      "Application:SpecificTask:Modification:ServerReply",
      (status: boolean) => {
        if (status) {
          StoreNotification(
            {
              title: "Tâche modifiée avec succès",
              description: `Tâche "${props.task?.title}" modifiée avec succès`,
              status: "success",
            },
            () => {
              navigate("/tasklist");
            }
          );
        } else {
          generateNotification(props.api, {
            title: "Erreur interne",
            description:
              "La tâche n'a pas été modifiée. Veuillez réessayer plus tard",
            status: "error",
          });
        }
      }
    );
  }, []);

  const navigate = useNavigate();
  console.log("collaborators : " + props.collaborators.length);

  const createDescription = (date: Date | undefined) => {
    return (
      <p className="text-xs font-light">
        Le {dayjs(date).format("DD-MM-YYYY")}
      </p>
    );
  };

  const task = props.task;
  let taskRender = <div></div>;
  if (task != undefined) {
    const current = statusToCurrent(task?.status);
    taskRender = (
      <div className="flex-grow w-full flex flex-col">
        <div className="flex flex-grow w-full h-full">
          <div className="md:w-3/4 w-full flex">
            <div className="flex-grow h-full md:ml-20 md:mx-0 mx-5">
              <TacheDataDisplay
                selectedCollaborators={props.collaborators}
                users={props.users}
                collaborators={props.collaborators}
                task={props.task}
                isTaskOwner={props.isTaskOwner}
                onChangeDate={(date) => {
                  setWasModified(true);
                  setLimitDate(date);
                }}
                onChangeCollaborators={(collaborators) => {
                  setWasModified(true), props.setCollaborators(collaborators);
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
                  title: "Créée",
                  description: createDescription(task.date_created),
                },
                {
                  title: "Commencée",
                  description:
                    current > 0 ? createDescription(task.date_started) : "",
                },
                {
                  title: "Terminée",
                  description:
                    current > 1 ? createDescription(task.date_end) : "",
                },
              ]}
            ></Steps>
          </div>
        </div>
        <hr className="border-[#707070] mx-5 md:mx-20" />
        <div
          className={
            "flex md:flex-row flex-col justify-center md:gap-2 items-center py-2 min-h-[7.5rem] "
          }
        >
          <Tooltip
            title={
              wasModified && props.collaborators?.length == 0
                ? "Ajoutez des collaborateurs pour sauvegarder!"
                : null
            }
          >
            <Button
              danger={task.status == "Completed" && !wasModified}
              disabled={
                awaitingServer ||
                (wasModified && props.collaborators?.length == 0)
              }
              loading={
                awaitingServer && !awaitingServerRed && !awaitingServerDelete
              }
              type="primary"
              className={
                "md:mt-0 mt-1.5 " + (props.isTaskOwner ? "" : "hidden")
              }
              onClick={() => {
                wasModified
                  ? onSave()
                  : task.status == "Completed"
                  ? showConfirm(
                      onUnCompleteTask,
                      `Voulez-vous vraiment marquer '${task.title}' comme non-complétée?`
                    )
                  : task.status == "Waiting"
                  ? onStartTask()
                  : onCompleteTask();
              }}
            >
              {wasModified
                ? "Sauvegarder"
                : task.status == "Completed"
                ? "Marquer comme non-terminée"
                : task.status == "Waiting"
                ? "Marquer comme commencée"
                : "Marquer comme terminée"}
            </Button>
          </Tooltip>

          <Button
            onClick={() => {
              showConfirm(
                onUnstartTask,
                `Voulez-vous vraiment réinitialiser l'état de '${task.title}'?`
              );
            }}
            disabled={awaitingServer}
            loading={awaitingServerRed}
            danger
            type="primary"
            className={
              task.status == "In Progress" && props.isTaskOwner
                ? "md:mt-0 mt-1.5"
                : "hidden"
            }
          >
            Réinitialiser état de la tâche
          </Button>

          <Button
            danger
            type="primary"
            className={props.isTaskOwner ? "md:mt-0 mt-1.5" : "hidden"}
            onClick={() => {
              showConfirm(
                onDeleteTask,
                `Voulez-vous vraiment supprimer '${task.title}'?`
              );
            }}
            disabled={awaitingServer}
            loading={awaitingServerDelete}
          >
            Supprimer
          </Button>

          <Button
            disabled={awaitingServer}
            onClick={() => {
              navigate("/taskList");
            }}
            type={props.isTaskOwner ? "default" : "primary"}
            className="md:mt-0 mt-1"
          >
            Retour
          </Button>
        </div>
      </div>
    );
  }
  return taskRender;
}
