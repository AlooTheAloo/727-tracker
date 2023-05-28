import React, { ChangeEventHandler, useEffect, useState } from "react";
import { user } from "../../../../server-client/types.js";
import { socket } from "../../../App.js";
import SubmitEventForm from "./SubmitEventForm.js";
import EventFormBody from "./EventFormBody.js";

interface CreateEventFormProps {
  onSubmit: (
    title: string,
    start_date: Date | undefined,
    end_date: Date | undefined,
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

function CreateEventForm(props: CreateEventFormProps) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [users, setUsers] = useState<user[]>([]); // All users

  useEffect(() => {
    if (props.projectID == null) return;
    if (props.projectID == -1)
      socket.emit(
        "Application:CreateEvent:Request:AllLinkedUsers",
        props.projectID
      );
    socket.emit(
      "Application:CreateEvent:Request:ProjectUsers",
      props.projectID
    );
  }, [props.projectID]);

  useEffect(() => {
    socket.on("Application:CreateEvent:Receive:Users", (users: user[]) => {
      setUsers(users);
    });
  }, []);

  return (
    <div className="flex flex-col h-full w-full flex-grow">
      <div className="flex h-96 flex-grow w-full">
        <EventFormBody
          setTitle={setTitle}
          setCollaborators={props.setCollaborators}
          setStart={setStartDate}
          setEnd={setEndDate}
          users={users}
          collaborators={props.collaborators}
        />
      </div>
      <hr className="border-[#707070] mx-5 md:mx-20" />
      <SubmitEventForm
        start_date={startDate}
        end_date={endDate}
        awaitingServer={props.awaitingServer}
        setAwaitingServer={props.setAwaitingServer}
        onCancel={props.onCancel}
        onSubmit={props.onSubmit}
        collaborators={props.collaborators}
        title={title}
        projectID={props.projectID == null ? undefined : props.projectID}
      />
    </div>
  );
}

export default CreateEventForm;
