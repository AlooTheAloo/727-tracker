//TO MODIFY (THIS IS JUST COPIED OR SLIGHT CHANGES)

import { Button, Tooltip } from "antd";
import React, { useState } from "react";
import { organisation, user } from "../../../server-client/types.js";

interface SubmitFormProjectProps {
  onCancel: () => void;
  onSubmit: (
    title: string,
    description: string,
    due_date: Date | undefined,
    collaborators: user[],
    organisationID: number | null
  ) => void;
  title: string;
  description: string;
  due_date: Date | undefined;
  collaborators: user[];
  organisationID: number | null;
  awaitingServer: boolean;
  setAwaitingServer: React.Dispatch<React.SetStateAction<boolean>>;
}

function SubmitFormProject(props: SubmitFormProjectProps) {
  const buttonDisabledReason = (
    <div>
      <p className="text-center">
        {
          props.title == "" && props.collaborators.length == 0
          ? "Ajoutez un titre et des collaborateurs pour créer le projet !"
          : props.title == ""
          ? "Ajoutez un titre pour créer le projet !"
          : props.collaborators.length == 0
          ? "Ajoutez des collaborateurs pour créer le projet !"
          : ""
        }
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
              props.onSubmit(
                props.title,
                props.description,
                props.due_date,
                props.collaborators,
                props.organisationID
              );
              props.setAwaitingServer(true);
            }}
            disabled={
              props.title == "" ||
              props.collaborators.length == 0 ||
              props.awaitingServer
            }
          >
            Créer projet
          </Button>
        </Tooltip>

        <Button className="mt-5 md:mt-0 md:ml-5 " onClick={props.onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
}

export default SubmitFormProject;
