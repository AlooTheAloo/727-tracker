import { DatePicker, Input } from "antd";
import { RangePickerProps } from "antd/es/date-picker";
import dayjs, { Dayjs } from "dayjs";
import React from "react";
import { user } from "../../../../server-client/types.js";
import { disabledBeforeToday } from "../../../utils/index.js";
import CollaboratorsSelection from "../../Taches/CreateTache/formBody/collaboratorsSelection.js";
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface eventFormBodyProps {
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  setCollaborators: React.Dispatch<React.SetStateAction<user[]>>;
  setStart: React.Dispatch<React.SetStateAction<Date | undefined>>;
  setEnd: React.Dispatch<React.SetStateAction<Date | undefined>>;
  users: user[];
  collaborators: user[];
}

function EventFormBody(props: eventFormBodyProps) {
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

          <b className="text-xl mt-5">Date et heure</b>
          <div className="w-full">
            <RangePicker
              showTime
              format={"YYYY-MM-DD HH:mm"}
              disabledDate={disabledBeforeToday}
              onChange={(range) => {
                props.setStart(range?.[0]?.toDate() ?? undefined);
                props.setEnd(range?.[1]?.toDate() ?? undefined);
              }}
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

export default EventFormBody;
