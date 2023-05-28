import { Progress, Steps } from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { project, task, status } from "../../../server-client/types.js";
import { getTimeDiff } from "../../utils/index.js";

interface projectCardProps {
  project: project;
}

function ProjectCard(props: projectCardProps) {
  const statusToCurrent = (status: status) => {
    console.log("status : " + status);
    switch (status) {
      case "Waiting":
        return 0;
      case "In Progress":
        return 1;
      case "Completed":
        return 2;
    }
  };

  const navigate = useNavigate();
  return (
    <div
      className="bg-white rounded-lg w-[95%] h-fit mt-4 flex-col justify-between 
        hover:bg-gray-200 hover:cursor-pointer transition-all"
      onClick={() => {
        navigate(`/project/${props.project.id_project}`, {
          state: { projectID: props.project.id_project },
        });
      }}
    >
      <div className="w-full  md:flex justify-between items-center">
        <div className="text-center md:text-left justify-center md:justify-start flex items-center w-full md:w-2/3 xl:w-full ">
          <h1 className="w-[95%] text-2xl font-bold m-4 break-words">
            {props.project.title}
          </h1>
        </div>

        <div className="hidden xl:block flex-shrink w-60">
          <div className="text-sm md:text-base mr-4 text-center whitespace-nowrap font-semibold">
            {getTimeDiff(props.project.date_modified, "Créé").display}
          </div>
          <div className="text-sm md:text-base mr-4 text-center whitespace-nowrap font-semibold">
            {props.project.date_todo == undefined
              ? "(Aucune date limite)"
              : getTimeDiff(props.project.date_todo, "Dû").display}
          </div>
        </div>

        <div className="w-full flex md:justify-end justify-center">
          <Steps
            className="h-full pointer-events-none"
            type="inline"
            direction="vertical"
            current={statusToCurrent(props.project.status)}
            items={[
              {
                title: "Créé",
              },
              {
                title: "Commencé",
              },
              {
                title: "Terminé",
              },
            ]}
          />
        </div>
      </div>

      <div className="flex-grow min-w-0 h-fit flex justify-between ">
        <p className=" text-slate-700 m-4">
          {props.project.description == null || props.project.description == ""
            ? "(Aucune description)"
            : props.project.description}
        </p>

        <div
          className={
            props.project.taskCompleted == null ||
            props.project.taskTotal == null
              ? "hidden"
              : "block"
          }
        >
          <div className="w-44 mr-2 md:block hidden">
            <Progress
              className="w-full"
              strokeColor={"#1677ff"}
              width={176} // We have to use width, size will make it into a circle
              percent={
                props.project.taskCompleted == undefined ||
                props.project.taskTotal == undefined
                  ? 0
                  : (props.project.taskCompleted * 100) /
                    props.project.taskTotal
              }
              showInfo={false}
            />
            <p className="-mt-2 w-full text-right text-sm">
              {props.project.taskCompleted} / {props.project.taskTotal} tâche
              {props.project.taskCompleted == null
                ? ""
                : props.project.taskCompleted != 1
                ? "s"
                : ""}{" "}
              complétée{props.project.taskCompleted != 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectCard;
