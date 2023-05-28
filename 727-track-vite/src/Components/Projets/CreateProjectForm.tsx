//TO MODIFY (THIS IS JUST COPIED OR SLIGHT CHANGES)

import React, { ChangeEventHandler, useEffect, useState } from "react";
import { user } from "../../../server-client/types.js";
import { socket } from "../../App.js";

//to verify
import SubmitFormProject from "./submitFormProject";
import SideExampleProject from "./sideExampleProject";

//To change
import FormBody from "../Taches/CreateTache/formBody/formBody.js";

interface CreateProjectFormProps {
  onSubmit: (
    title: string,
    description: string,
    due_date: Date | undefined,
    collaborators: user[],
    organisationID: number | null
  ) => void;
  onCancel: () => void;
  collaborators: user[];
  organisationID: number | null;
  awaitingServer: boolean;
  setAwaitingServer: React.Dispatch<React.SetStateAction<boolean>>;
  setCollaborators: React.Dispatch<React.SetStateAction<user[]>>;
}

function CreateProjectForm(props: CreateProjectFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date>();

  const [users, setUsers] = useState<user[]>([]); // All users

  useEffect(() => {
    if (props.organisationID == null) return;
    socket.emit("Application:CreateProject:GetColl", props.organisationID);
  }, [props.organisationID]);

  useEffect(() => {
    socket.on("Application:CreateProject:ReceiveColl", (users: user[]) => {
      setUsers(users);
    });
  }, []);

  return (
    <div className="flex flex-col h-full w-full flex-grow">
      <div className="flex h-96 flex-grow w-full">
        <FormBody
          collaborators={props.collaborators}
          setTitle={setTitle}
          setDescription={setDescription}
          setCollaborators={props.setCollaborators}
          setDueDate={setDueDate}
          users={users}
        />

        <SideExampleProject
          title={title}
          description={description}
          dueDate={dueDate}
        />
      </div>
      <hr className="border-[#707070] mx-5 md:mx-20" />
      <SubmitFormProject
        awaitingServer={props.awaitingServer}
        setAwaitingServer={props.setAwaitingServer}
        onCancel={props.onCancel}
        onSubmit={props.onSubmit}
        collaborators={props.collaborators}
        description={description}
        due_date={dueDate}
        title={title}
        organisationID={
          props.organisationID == null ? null : props.organisationID
        }
      />
    </div>
  );
}

export default CreateProjectForm;
