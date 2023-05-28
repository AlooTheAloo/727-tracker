import { Button, Tooltip } from "antd";
import React, { useState } from "react";
import { project, user } from "../../../../server-client/types.js";

interface SubmitEventFormProps {
  onCancel: () => void;
  onSubmit: (
    title: string,
    start_date: Date | undefined,
    end_date: Date | undefined,
    collaborators: user[],
    projectID: number | undefined
  ) => void;
  title: string;
  collaborators: user[];
  projectID: number | undefined;
  awaitingServer: boolean;
  setAwaitingServer: React.Dispatch<React.SetStateAction<boolean>>;
  start_date: Date | undefined;
  end_date: Date | undefined;
}

function SubmitEventForm(props: SubmitEventFormProps) {
  const buttonDisabledReason = (
    <div>
      <p className="text-center">
        {props.start_date == null || props.end_date == null
          ? "Ajouter des dates pour créer l'événement"
          : props.title == "" && props.collaborators.length == 0
          ? "Ajoutez un titre et des collaborateurs pour créer l'événement !"
          : props.title == ""
          ? "Ajoutez un titre pour créer l'événement !"
          : props.collaborators.length == 0
          ? "Ajoutez des collaborateurs pour créer le projet !"
          : ""}
      </p>
    </div>
  );

  return (
    <div className="h-1/5 mx-20 flex flex-col flex-grow">
      <div className="flex w-full h-full flex-grow items-center justify-center flex-col md:flex-row ">
        <Tooltip
          title={
            props.title == "" ||
            props.collaborators.length == 0 ||
            props.start_date == undefined ||
            props.end_date == undefined
              ? buttonDisabledReason
              : null
          }
        >
          <Button
            type="primary"
            loading={props.awaitingServer}
            onClick={() => {
              props.onSubmit(
                props.title,
                props.start_date,
                props.end_date,
                props.collaborators,
                props.projectID
              );
              props.setAwaitingServer(true);
            }}
            disabled={
              props.title == "" ||
              props.collaborators.length == 0 ||
              props.awaitingServer ||
              props.start_date == undefined ||
              props.end_date == undefined
            }
          >
            Créer événement
          </Button>
        </Tooltip>

        <Button className="mt-5 md:mt-0 md:ml-5 " onClick={props.onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
}

export default SubmitEventForm;
