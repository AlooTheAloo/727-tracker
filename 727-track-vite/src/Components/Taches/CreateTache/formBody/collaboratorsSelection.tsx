import { Select } from "antd";
import React, { useEffect } from "react";
import { user } from "../../../../../server-client/types.js";

const { Option } = Select;

interface CollaboratorsSelectionProps {
  collaborators: user[];
  defaultValue: user[];
  onChange: (users: user[]) => void;
  disabled: boolean;
  placeholder: string;
  selectedCollaborators: user[];
}

function CollaboratorsSelection(props: CollaboratorsSelectionProps) {
  function sanitizeInput(dataArr: string[]) {
    const users: user[] = dataArr // All datas that have been selected
      .map(
        (id) => props.collaborators.filter((x) => x.id_user == id)[0] // The user that correspond
      );
    props.onChange(users);


  }

  useEffect(() => {
    console.log(props.collaborators.length);
  }, [props.collaborators])

  return (
    <div className="w-full">
      <Select
        className="w-full"
        defaultValue={props.defaultValue.map((x) => x.id_user)}
        mode="multiple"
        disabled={props.disabled}
        filterOption={(input: string, option: any) => {
          return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
        }}
        maxTagCount="responsive"
        onChange={sanitizeInput}
        placeholder={props.placeholder}
        notFoundContent={<NoCollaboratorsFound />}
        value={props.selectedCollaborators.map((x) => x.id_user)}
      >
        {props.collaborators.map((collaborator) => {
          console.log("collaborator : " + JSON.stringify(collaborator));
          return (
            <Option
              key={collaborator.id_user}
              value={collaborator.id_user}
              label={collaborator.username}
            >
              <div className="flex items-center ">
                <img
                  src={collaborator.profile_picture}
                  className="w-5 h-5 rounded-sm"
                  referrerPolicy="no-referrer"
                />
                <p className="ml-2 h-5 leading-5">{collaborator.username}</p>
              </div>
            </Option>
          );
        })}
      </Select>
    </div>
  );
}

function NoCollaboratorsFound() {
  return (
    <div className="items-center justify-center h-20 flex">
      <p>Aucun collaborateur trouvé :(</p>
    </div>
  );
}

export default CollaboratorsSelection;
