import React from "react";

interface OrgListOrgDataComponentProps {
  title: string;
  description: string;
  data: number;
  colorClass: string;
  clickEvent: () => void;
}

export function OrgListOrgDataComponent(props: OrgListOrgDataComponentProps) {
  return (
    <div
      className="h-20 w-full flex items-center cursor-pointer select-none "
      onClick={props.clickEvent}
    >
      <div
        className={
          "h-16 w-16 flex justify-center items-center rounded-xl " +
          props.colorClass
        }
      >
        <p className="text-white font-bold text-xl">{props.data}</p>
      </div>
      <div className={"h-16 ml-4 flex-grow flex flex-col justify-center  "}>
        <p className="text-xl font-bold">
          {props.title}
          {props.data == 1 ? "" : "s"}
        </p>
        <p className="font-base text-sm">{props.description}</p>
      </div>
    </div>
  );
}

export default OrgListOrgDataComponent;
