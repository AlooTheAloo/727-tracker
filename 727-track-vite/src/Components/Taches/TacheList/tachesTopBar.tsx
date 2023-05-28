import { RadioChangeEvent, Select } from "antd";
import React from "react";
import { PlusOutlined } from "@ant-design/icons";
import TacheStyleSelector from "./tacheStyleSelector.js";
import { project } from "../../../../server-client/types.js";

interface tachesTopBarProps {
  handleProjectChange: (value: number, option: any) => void;
  handleCreateTask: () => void;
  handleChangeStyle: (value: RadioChangeEvent) => void;
  projects: project[];
  selectedStyle: boolean;
  selectedProject: number;
}

function TachesTopBar(props: tachesTopBarProps) {
  return (
    <>
      <h1 className="w-11/12 text-4xl my-6 font-semibold text-center">
        Tâches
      </h1>
      <div className="w-11/12 flex items-center justify-between ">
        <Select
          defaultValue={-1}
          style={{ width: 200, background: "white" }}
          onChange={props.handleProjectChange}
          value={props.selectedProject}
          options={[
            { value: -1, label: "Tous les projets" },
            ...props.projects.map((project) => ({
              value: project.id_project,
              label: project.title,
            })),
          ]}
        />
        <div className="bg-gray-900 float-right justify-center align-middle rounded-xl flex">
          <button
            onClick={props.handleCreateTask}
            className="w-12 h-12 bg-inherit rounded-xl"
          >
            <PlusOutlined className="invert text-lg" />
          </button>
        </div>
      </div>
      <div className="w-11/12 my-2 ">
        <TacheStyleSelector
          selectedStyle={props.selectedStyle}
          onChange={props.handleChangeStyle}
        />
      </div>
    </>
  );
}

export default TachesTopBar;
