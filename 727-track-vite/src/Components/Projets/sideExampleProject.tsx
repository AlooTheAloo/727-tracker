//TO MODIFY (THIS IS JUST COPIED OR SLIGHT CHANGES)

import React from "react";
import { CalendarOutlined } from "@ant-design/icons";
import { getTimeDiff } from "../../utils/index.js";

interface SideExampleProps {
  title: string;
  description: string;
  dueDate: Date | undefined;
}

function SideExampleProject(props: SideExampleProps) {
  return (
    <div className="hidden lg:flex flex-col justify-center  flex-grow w-2/5 mr-16">
      <div className="flex flex-col justify-between bg-white h-2/3 rounded-xl w-[calc(100% - 2.5rem)] mx-5 ">
        <p className="m-4 text-lg whitespace-nowrap text-ellipsis overflow-hidden">
          {props.title == "" ? "(Aucun titre)" : props.title}
        </p>

        <p className="m-4 text-sm h-40 w-[calc(100% - 1rem)] break-all overflow-hidden leading-[1.06rem]">
          {props.description == "" ? "(Aucune description)" : props.description}
        </p>

        <div className="m-4 flex">
          <CalendarOutlined />
          <p className="ml-2">
            {props.dueDate == undefined
              ? "(Aucune date limite)"
              : getTimeDiff(props.dueDate, "Dû").display}
          </p>
        </div>
      </div>
    </div>
  );
}
export default SideExampleProject;
