import { DatePicker, Input } from "antd";
import { RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";
import React from "react";
import { project, task, user } from "../../../../server-client/types.js";
import { disabledBeforeToday } from "../../../utils/index.js";
import CollaboratorsSelection from "../../Taches/CreateTache/formBody/collaboratorsSelection.js";
import frFR from "antd/locale/fr_FR";

const { TextArea } = Input;

interface ProjectDataDisplayProps {
  project: project | undefined;
  isTaskOwner: boolean;
  users: user[];
  selectedCollaborators: user[];
  collaborators: user[];
  onChangeDate: (date: Date | undefined) => void;
  onChangeDescription: (description: string) => void;
  onChangeCollaborators: (collaborators: user[]) => void;
}

function ProjectDataDisplay(props: ProjectDataDisplayProps) {
  if (props.project == undefined) return null;
  else
    return (
      <div className="h-full w-full">
        <div className="flex flex-col justify-center h-full text-xl font-semibold gap-4">
          <div>
            Date limite
            <div>
              <DatePicker
                className="w-40"
                disabledDate={disabledBeforeToday}
                onChange={(date) => {
                  props.onChangeDate(date?.toDate());
                }}
                placeholder="Aucune date limite"
                defaultValue={
                  props.project.date_todo == null
                    ? undefined
                    : dayjs(props.project.date_todo)
                }
                disabled={!props.isTaskOwner}
              />
            </div>
          </div>

          <div>
            Description
            <div>
              <div className="md:w-3/4 w-full">
                <TextArea
                  onChange={(e) => {
                    props.onChangeDescription(e.target.value);
                  }}
                  defaultValue={props.project.description}
                  disabled={!props.isTaskOwner}
                  style={{ resize: "none", height: "10rem" }}
                  maxLength={1000}
                  showCount={props.isTaskOwner}
                  placeholder="Ma description importante"
                />
              </div>
            </div>
          </div>

          <div className={"md:w-3/4 w-full "}>
            Collaborateurs
            <CollaboratorsSelection
              placeholder={
                !props.isTaskOwner
                  ? "Aucun collaborateur"
                  : "Ajouter un collaborateur..."
              }
              disabled={!props.isTaskOwner}
              defaultValue={props.collaborators}
              collaborators={props.users}
              selectedCollaborators={props.selectedCollaborators}
              onChange={(users) => {
                props.onChangeCollaborators(users);
              }}
            />
          </div>
        </div>
      </div>
    );
}

export default ProjectDataDisplay;
