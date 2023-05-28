import React, { useEffect, useState } from "react";
import { CalendarOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

interface TacheProps {
  title: string;
  description: string;
  timeInfo: tacheTimeInfo;
  tacheStyle: boolean;
  tacheID: number;
}

export interface tacheTimeInfo {
  display: string;
  danger: boolean;
  time_due: number;
}

function TacheListTache(props: TacheProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => {
        navigate(`/task/${props.tacheID}`);
      }}
      className={
        (props.tacheStyle
          ? "w-80 lg:w-96 h-52 mx-5 mt-4 "
          : "w-11/12 h-12 flex justify-between mt-4 ") +
        "bg-white rounded-lg hover:bg-gray-200 hover:cursor-pointer transition-colors "
      }
    >
      <div
        className={
          (props.tacheStyle ? "w-full " : "flex-shrink ") + "min-w-0 flex-grow"
        }
      >
        <p
          className={
            (props.tacheStyle ? "text-2xl font-bold" : "text-base font-bold") +
            " ml-4 leading-[3rem] text-ellipsis whitespace-nowrap overflow-hidden"
          }
        >
          {props.title}
        </p>
      </div>
      <p className={(props.tacheStyle ? "" : "hidden ") + "m-4 text-slate-500"}>
        {props.description}
      </p>
      <div
        className={
          "flex-shrink-0 flex items-center ml-4 " +
          (props.tacheStyle ? "justify-start " : "justify-end ") +
          (props.timeInfo.danger ? " text-red-500" : "")
        }
      >
        <CalendarOutlined />
        <div
          className={(props.tacheStyle ? "m-4" : "mx-4 ") + " font-semibold"}
        >
          {props.timeInfo.display}
        </div>
      </div>
    </div>
  );
}

export default TacheListTache;
