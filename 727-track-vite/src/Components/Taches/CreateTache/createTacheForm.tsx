import React, { ChangeEventHandler, useEffect, useState } from "react";
import { user } from "../../../../server-client/types.js";
import { socket } from "../../../App.js";
import SubmitForm from "./submitForm";
import SideExample from "./sideExample";
import FormBody from "./formBody/formBody.js";

interface CreateTacheFormProps {
  onSubmit: (
    title: string,
    description: string,
    due_date: Date | undefined,
    collaborators: user[],
    projectID: number | undefined
  ) => void;
  onCancel: () => void;
  projectID: number | null;
  awaitingServer: boolean;
  setAwaitingServer: React.Dispatch<React.SetStateAction<boolean>>;
  setCollaborators: React.Dispatch<React.SetStateAction<user[]>>;
  collaborators: user[];
}

function CreateTacheForm(props: CreateTacheFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [users, setUsers] = useState<user[]>([]); // All users

  useEffect(() => {
    if (props.projectID == null) return;
    socket.emit(
      "Application:CreateTache:Request:ProjectUsers",
      props.projectID
    );
  }, [props.projectID]);

  useEffect(() => {
    socket.on(
      "Application:CreateTache:Receive:ProjectUsers",
      (users: user[]) => {
        setUsers(users);
      }
    );
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

        <SideExample
          title={title}
          description={description}
          dueDate={dueDate}
        />
      </div>
      <hr className="border-[#707070] mx-5 md:mx-20" />
      <SubmitForm
        awaitingServer={props.awaitingServer}
        setAwaitingServer={props.setAwaitingServer}
        onCancel={props.onCancel}
        onSubmit={props.onSubmit}
        collaborators={props.collaborators}
        description={description}
        due_date={dueDate}
        title={title}
        projectID={props.projectID == null ? undefined : props.projectID}
      />
    </div>
  );
}

export default CreateTacheForm;
