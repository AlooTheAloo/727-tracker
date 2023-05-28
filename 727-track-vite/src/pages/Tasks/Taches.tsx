import React, { useEffect, useState } from "react";
import { socket } from "../../App.js";
import { Button, notification, RadioChangeEvent, Skeleton, Space } from "antd";
import SideBar, { SideBarOptions } from "../../Components/Global/SideBar.js";
import TacheListTache from "../../Components/Taches/TacheList/tacheListTache.js";
import { useLocation, useNavigate } from "react-router-dom";
import { project, task } from "../../../server-client/types.js";
import TachesTopBar from "../../Components/Taches/TacheList/tachesTopBar.js";
import Cookies from "js-cookie";
import {
  generateNotification,
  getTimeDiff,
  timeDifInfo,
} from "../../utils/index";
import { notificationData } from "../../utils/frontend-types.js";
import { ArgsProps } from "antd/es/message";

function Taches() {
  const [api, contextHolder] = notification.useNotification();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number>(-1);
  const [tasks, setTasks] = useState<task[]>();
  const [tacheStyle, setTacheStyle] = useState<boolean>(() => {
    return true;
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(false); //ONLY USE FOR FRONTEND GAMACHE !!!!!

  function getProjects() {
    socket.emit("Application:Taches:GetProjects");
  }

  function getTaches() {
    socket.emit("Application:Taches:GetTasks");
  }

  function getIsAdmin() {
    socket.emit("Application:Admin:CheckCurrentUserAdmin");
  }

  function handleProjectChange(value: number) {
    setSelectedProject(value);
  }

  function handleCreateTask() {
    navigate("/createtache", { state: { selectedProject: selectedProject } });
  }

  function handleChangeStyle(e: RadioChangeEvent) {
    Cookies.set("tacheListTache", e.target.value);
    setTacheStyle(e.target.value == "grid");
  }

  const { state: pageState } = useLocation();

  function createListeners() {
    socket.on("Application:Taches:ReceiveTasks", (tasks: task[]) => {
      setTasks(tasks);
    });
    socket.on("Application:Taches:ReceiveProjects", (projects: project[]) => {
      setProjects(projects);
    });
    socket.on("Application:Admin:ReceiveCurrentUserAdmin", (admin: boolean) => {
      setIsAdmin(admin);
    });
  }

  useEffect(() => {
    // Tache style cookie
    const tlt = Cookies.get("tacheListTache");
    if (tlt == undefined) setTacheStyle(false);
    else setTacheStyle(tlt == "grid");

    if (pageState != null) {
      if (pageState.projectID != undefined)
        setSelectedProject(pageState.projectID);
    }

    const taskData: string | null = localStorage.getItem("showNotification");

    if (taskData != null) {
      const parsedTaskData: notificationData = JSON.parse(taskData);
      generateNotification(api, parsedTaskData);
    }

    localStorage.removeItem("showNotification");

    if (socket == null) return;
    createListeners();
    getProjects();
    getTaches();
    getIsAdmin();
  }, []);

  function TacheList() {
    if (tasks == undefined) {
      return (
        <div className="w-full h-full">
          <div className="w-full flex justify-center h-full ">
            <div
              className={
                tacheStyle
                  ? "w-full flex flex-wrap justify-center"
                  : "w-11/12 h-full"
              }
            >
              {Array.apply(null, Array(tacheStyle ? 4 : 8)).map((x, i) => {
                if (tacheStyle) {
                  return (
                    <Skeleton.Node
                      key={i}
                      style={{ width: "20rem", height: "13rem" }}
                      fullSize
                      active
                      className="mx-2.5 mt-2 "
                    >
                      <div />
                    </Skeleton.Node>
                  );
                } else
                  return (
                    <Skeleton.Button
                      key={i}
                      style={{ height: "3rem" }}
                      className="mt-2"
                      block
                      active
                      size="large"
                    />
                  );
              })}
            </div>
          </div>
        </div>
      );
    } else {
      const filteredTasks = tasks.filter(
        (x) => x.projects_id_project == selectedProject || selectedProject == -1
      );
      if (filteredTasks.length > 0) {
        return (
          <>
            {contextHolder}

            {filteredTasks
              .sort((a, b) => {
                const c: task = { ...a };
                const d: task = { ...b };
                if (c.date_todo == undefined)
                  c.date_todo = new Date(8.64 * 1e13);
                if (d.date_todo == undefined)
                  d.date_todo = new Date(8.64 * 1e13);
                return (
                  getTimeDiff(c.date_todo).time_due -
                  getTimeDiff(d.date_todo).time_due
                );
              })
              .map((task, i) => {
                let info: timeDifInfo;
                if (task.date_todo == undefined) {
                  info = {
                    danger: false,
                    display: "Aucune date limite",
                    time_due: -1,
                  };
                } else {
                  info = getTimeDiff(task.date_todo, "Dû");
                }
                return (
                  <TacheListTache
                    key={i}
                    tacheStyle={tacheStyle}
                    title={task.title}
                    description={task.description}
                    timeInfo={info}
                    tacheID={task.id_task}
                  />
                );
              })}
          </>
        );
      } else
        return (
          <div className="flex flex-col">
            {contextHolder}
            <p className="w-full h-full text-center"> Aucune tâche trouvée. </p>
            <Button type="link" onClick={handleCreateTask}>
              {" "}
              Créer une nouvelle tâche{" "}
            </Button>
          </div>
        );
    }
  }

  return (
    <>
      <div className="flex w-screen ">
        {contextHolder}
        <SideBar selectedOption={SideBarOptions.Tasks} />
        <div className="flex-grow flex flex-col h-full items-center">
          <TachesTopBar
            selectedProject={selectedProject}
            selectedStyle={tacheStyle}
            projects={projects}
            handleChangeStyle={handleChangeStyle}
            handleCreateTask={handleCreateTask}
            handleProjectChange={handleProjectChange}
          />
          <div
            className={
              (tasks == undefined ||
              tasks.filter(
                (x) =>
                  x.projects_id_project == selectedProject ||
                  selectedProject == -1
              ).length > 0
                ? ""
                : "justify-center ") +
              (tacheStyle &&
              (tasks == undefined ||
                tasks.filter(
                  (x) =>
                    x.projects_id_project == selectedProject ||
                    selectedProject == -1
                ).length > 0)
                ? "flex-wrap items-start justify-center "
                : "flex-col items-center ") +
              "flex bg-[#E9E9E9]  border-[#707070] border-2 w-11/12 min-h-[35rem] rounded-lg overflow-x-hidden content-start "
            }
          >
            <TacheList />
            <div
              className={"h-5 w-full" + (tasks?.length == 0 ? " hidden" : "")}
            />
          </div>
          <div className="h-5 w-full" />
        </div>
      </div>
    </>
  );
}

export default Taches;
