import { Button, Modal, notification, Steps, Tooltip } from "antd";
import { NotificationInstance } from "antd/es/notification/interface";
import { DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import React, { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { event, status, task, user } from "../../../../server-client/types.js";
import { socket } from "../../../App.js";
import { generateNotification, StoreNotification } from "../../../utils/index";
import { notificationData } from "../../../utils/frontend-types.js";
import TacheDataDisplay from "./EventDataDisplay.js";
import EventDataDisplay from "./EventDataDisplay.js";

interface RenderedEventProps {
  event: event | undefined;
  users: user[];
  collaborators: user[];
  setCollaborators: React.Dispatch<React.SetStateAction<user[]>>;
  api: NotificationInstance;
}

export function RenderedEvent(props: RenderedEventProps) {
  const [wasModified, setWasModified] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string | undefined>(
    props.event?.date_start
  );
  const [endDate, setEndDate] = useState<string | undefined>(
    props.event?.date_end
  );
  const [awaitingServer, setAwaitingServer] = useState<boolean>(false);
  const [awaitingServerDelete, setAwaitingServerDelete] =
    useState<boolean>(false);

  const { confirm } = Modal;

  const showConfirm = (callback: () => void, content: string) => {
    confirm({
      title: "Confirmer suppression",
      content: content,
      okText: "Continuer",
      okType: "danger",
      cancelText: "Annuler",
      onOk() {
        callback();
      },
    });
  };

  const onDeleteTask = () => {
    setAwaitingServer(true);
    setAwaitingServerDelete(true);
    socket.emit("Application:SpecificEvent:DeleteEvent", props.event?.id_event);
  };

  useEffect(() => {
    socket.on(
      "Application:SpecificEvent:Modification:ServerReply",
      (status: boolean) => {
        if (status) {
          StoreNotification(
            {
              title: "Événement modifié avec succès",
              description: `Événement "${props.event?.title}" modifié avec succès`,
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
              "L'événement n'a pas été modifié. Veuillez réessayer plus tard",
            status: "error",
          });
        }
      }
    );

    socket.on(
      "Application:SpecificEvent:DeleteEvent:ServerReply",
      (status: boolean) => {
        if (status) {
          StoreNotification(
            {
              title: "Événement supprimé avec succès",
              description: `Événement "${props.event?.title}" supprimé avec succès`,
              status: "success",
            },
            () => {
              navigate("/events");
            }
          );
        } else {
          generateNotification(props.api, {
            title: "Erreur interne",
            description:
              "L'événement n'a pas été supprimé. Veuillez réessayer plus tard",
            status: "error",
          });
        }
      }
    );
  }, []);

  const navigate = useNavigate();

  const event = props.event;
  let eventRender = <div></div>;
  if (event != undefined) {
    eventRender = (
      <div className="flex-grow w-full flex flex-col">
        <div className="flex flex-grow w-full h-full">
          <div className="w-full flex">
            <div className="flex-grow h-full md:ml-20 md:mr-0 mx-5 ">
              <EventDataDisplay
                start={startDate}
                end={endDate}
                selectedCollaborators={props.collaborators}
                users={props.users}
                collaborators={props.collaborators}
                event={props.event}
                onChangeStartDate={(date) => {
                  setWasModified(true);
                  setStartDate(date?.toISOString());
                }}
                onChangeEndDate={(date) => {
                  setWasModified(true);
                  setEndDate(date?.toISOString());
                }}
                onChangeCollaborators={(collaborators) => {
                  setWasModified(true), props.setCollaborators(collaborators);
                }}
              />
            </div>
          </div>
        </div>
        <hr className="border-[#707070] mx-5 md:mx-20" />
        <div
          className={
            "flex sm:flex-row flex-col justify-center sm:gap-2 items-center py-2 min-h-[7.5rem] "
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
              loading={awaitingServer}
              onClick={() => {
                socket.emit(
                  "Application:ModifyEvent:ModifyEvent",
                  event.id_event,
                  props.collaborators,
                  startDate,
                  endDate
                );
                setAwaitingServer(true);
              }}
              type={"primary"}
              disabled={props.collaborators?.length == 0}
              className={`${wasModified ? "" : "hidden"}`}
            >
              Sauvegarder
            </Button>
          </Tooltip>

          <Button
            danger
            type="primary"
            className={"sm:mt-0 mt-1.5"}
            onClick={() => {
              showConfirm(
                onDeleteTask,
                `Voulez-vous vraiment supprimer '${event.title}'?`
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
              navigate("/events");
            }}
            className="sm:mt-0 mt-1"
          >
            Retour
          </Button>
        </div>
      </div>
    );
  }
  return eventRender;
}
