import { DatePicker, Input } from "antd";
import { RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";
import React from "react";
import { event, task, user } from "../../../../server-client/types.js";
import { disabledBeforeToday } from "../../../utils/index.js";
import CollaboratorsSelection from "../../Taches/CreateTache/formBody/collaboratorsSelection.js";
import minmax from "dayjs/plugin/minMax.js";
const { RangePicker } = DatePicker;

interface EventDataDisplayProps {
  event: event | undefined;
  users: user[];
  collaborators: user[];
  selectedCollaborators: user[] | undefined;
  start: string | undefined;
  end: string | undefined;
  onChangeStartDate: (date: Date | undefined) => void;
  onChangeEndDate: (date: Date | undefined) => void;
  onChangeCollaborators: (collaborators: user[]) => void;
}

function EventDataDisplay(props: EventDataDisplayProps) {
  dayjs.extend(minmax);
  if (props.event == undefined) return null;
  else
    return (
      <div className="h-full w-full">
        <div className="flex flex-col justify-center h-full text-xl font-semibold gap-4 w-full">
          <div>
            Date et heure
            <div>
              <RangePicker
                showTime
                format={"YYYY-MM-DD HH:mm"}
                disabledDate={(current) => {
                  const min = dayjs.min(dayjs(props.start), dayjs());
                  return current < min;
                }}
                value={[dayjs(props.start), dayjs(props.end)]}
                onChange={(range) => {
                  props.onChangeStartDate(range?.[0]?.toDate() ?? undefined);
                  props.onChangeEndDate(range?.[1]?.toDate() ?? undefined);
                }}
              />
            </div>
          </div>

          <div className={"md:w-3/4 w-full "}>
            Collaborateurs
            <CollaboratorsSelection
              selectedCollaborators={props.selectedCollaborators ?? []}
              placeholder={"Ajouter un collaborateur..."}
              disabled={false}
              defaultValue={props.collaborators}
              collaborators={props.users}
              onChange={(users) => {
                props.onChangeCollaborators(users);
              }}
            />
          </div>
        </div>
      </div>
    );
}

export default EventDataDisplay;
