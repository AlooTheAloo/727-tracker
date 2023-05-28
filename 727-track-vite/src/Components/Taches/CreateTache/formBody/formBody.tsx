import { DatePicker, Input } from "antd";
import { RangePickerProps } from "antd/es/date-picker";
import dayjs, { Dayjs } from "dayjs";
import React from "react";
import { user } from "../../../../../server-client/types.js";
import { disabledBeforeToday } from "../../../../utils/index.js";
import CollaboratorsSelection from "./collaboratorsSelection.js";
const { TextArea } = Input;

interface formBodyProps {
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  setDueDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  setCollaborators: React.Dispatch<React.SetStateAction<user[]>>;
  collaborators: user[];
  users: user[];
}

function FormBody(props: formBodyProps) {
  return (
    <div className="flex-grow w-1/2 flex items-center">
      <div className="flex flex-col  justify-center ml-5 mr-5 md:ml-20 md:mr-20 lg:mr-0 h-full w-full lg:w-2/3 ">
        <div className="flex flex-col ">
          <b className="text-xl">Titre</b>
          <div className="w-2/3">
            <Input
              maxLength={100}
              onChange={(title) => {
                props.setTitle(title.target.value);
              }}
              showCount
              placeholder="Mon titre important"
            />
          </div>

          <b className="text-xl mt-5">Description</b>
          <div className="w-full">
            <TextArea
              onChange={(desc) => {
                props.setDescription(desc.target.value);
              }}
              style={{ resize: "none" }}
              className="h-20"
              maxLength={1000}
              showCount
              placeholder="Ma description importante"
            />
          </div>

          <b className="text-xl">Date limite</b>
          <div className="w-full">
            <DatePicker
              onChange={(date) => {
                props.setDueDate(date?.toDate());
              }}
              disabledDate={disabledBeforeToday}
              placeholder="Date limite"
            />
          </div>

          <b className="text-xl mt-5">Collaborateurs</b>
          <div className="w-full">
            <CollaboratorsSelection
              selectedCollaborators={props.collaborators}
              placeholder="Ajouter un collaborateur..."
              disabled={false}
              defaultValue={[]}
              onChange={(collaborators) => {
                console.log("Onchange called");
                props.setCollaborators(collaborators);
              }}
              collaborators={props.users}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default FormBody;
