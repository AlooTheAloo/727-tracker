import { Button, Tooltip } from "antd";
import React, { useState } from "react";
import { project, user } from "../../../../server-client/types.js";

interface SubmitFormProps {
  onCancel: () => void;
  onSubmit: (
    title: string,
    description: string,
    due_date: Date | undefined,
    collaborators: user[],
    projectID: number | undefined
  ) => void;
  title: string;
  description: string;
  due_date: Date | undefined;
  collaborators: user[];
  projectID: number | undefined;
  awaitingServer: boolean;
  setAwaitingServer: React.Dispatch<React.SetStateAction<boolean>>;
}

function SubmitForm(props: SubmitFormProps) {
  const buttonDisabledReason = (
    <div>
      <p className="text-center">
        {props.title == "" && props.collaborators.length == 0
          ? "Ajoutez un titre et des collaborateurs pour créer la tâche !"
          : props.title == ""
          ? "Ajoutez un titre pour créer la tâche !"
          : props.collaborators.length == 0
          ? "Ajoutez des collaborateurs pour créer la tâche !"
          : ""}
      </p>
    </div>
  );

  return (
    <div className="h-1/5 mx-20 flex flex-col flex-grow">
      <div className="flex w-full h-full flex-grow items-center justify-center flex-col md:flex-row ">
        <Tooltip
          title={
            props.title == "" || props.collaborators.length == 0
              ? buttonDisabledReason
              : null
          }
        >
          <Button
            type="primary"
            loading={props.awaitingServer}
            onClick={() => {
              console.log("due date : " + props.due_date?.toString());
              props.onSubmit(
                props.title,
                props.description,
                props.due_date,
                props.collaborators,
                props.projectID
              );
              props.setAwaitingServer(true);
            }}
            disabled={
              props.title == "" ||
              props.collaborators.length == 0 ||
              props.awaitingServer
            }
          >
            Créer tâche
          </Button>
        </Tooltip>

        <Button className="mt-5 md:mt-0 md:ml-5 " onClick={props.onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
}

export default SubmitForm;
