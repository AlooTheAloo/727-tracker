import React, { useEffect, useState } from "react";
import { socket } from "../../App.js";
import SideBar, { SideBarOptions } from "../../Components/Global/SideBar.js";
import { organisation, project, task } from "../../../server-client/types.js";
import { PlusOutlined } from "@ant-design/icons";
import ProjectCard from "../../Components/Projets/Projectcard.js";
import { Button, notification, Select, Skeleton } from "antd";

//My imports
import { useLocation, useNavigate } from "react-router-dom";
import { generateNotification } from "../../utils/index.js";
import { notificationData } from "../../utils/frontend-types.js";

function Projets() {
  const [api, contextHolder] = notification.useNotification();
  const [projects, setProjects] = useState<project[] | undefined>(undefined);
  const [organisations, setOrganisations] = useState<organisation[]>([]);
  const { state: pageState } = useLocation();
  const [selectedorganisation, setSelectedorganisation] = useState<number>(-1);
  const navigate = useNavigate();
  function getProjects() {
    socket.emit("Application:Projets:GetProjects");
  }

  function getOrganisations() {
    socket.emit("Application:Projects:GetOrganisations");
  }

  function handleCreateProject() {
    navigate("/addproject", {
      state: { selectedorganisation: selectedorganisation },
    });
  }

  useEffect(() => {
    const taskData: string | null = localStorage.getItem("showNotification");

    if (taskData != null) {
      const parsedTaskData: notificationData = JSON.parse(taskData);
      generateNotification(api, parsedTaskData);
    }

    localStorage.removeItem("showNotification");

    socket.on("Application:Projets:ReceiveProjects", (projects: project[]) => {
      setProjects(projects);
    });

    socket.on(
      "Application:Projects:ReceiveOrganisations",
      (organisations: organisation[]) => {
        setOrganisations(organisations);

        if (pageState != null) {
          if (pageState.selectedorganisation != -1)
            setSelectedorganisation(pageState.selectedorganisation);
          else setSelectedorganisation(-1);
        }
      }
    );

    getProjects();
    getOrganisations();
  }, []);

  const ProjectList = () => {
    if (projects == undefined) {
      return (
        <div className="w-[95%] h-full flex flex-col items-center">
          {Array.apply(null, Array(4)).map((x, i) => {
            return (
              <Skeleton.Button
                key={i}
                active
                className="mt-2"
                block
                style={{ height: "7.5rem" }}
              />
            );
          })}
        </div>
      );
    } else if (
      projects.filter(
        (x) =>
          x.organisations_id_org == selectedorganisation ||
          selectedorganisation == -1
      ).length == 0
    ) {
      return (
        <div className="flex flex-col">
          <p className="w-full h-full text-center"> Aucun projet trouvé. </p>
          <Button type="link" onClick={handleCreateProject}>
            {" "}
            Créer un projet{" "}
          </Button>
        </div>
      );
    } else
      return (
        <>
          {projects
            .filter(
              (x) =>
                x.organisations_id_org == selectedorganisation ||
                selectedorganisation == -1
            )
            .map((projet, i) => (
              <ProjectCard key={i} project={projet} />
            ))}
        </>
      );
  };

  return (
    <>
      {contextHolder}
      <div className="flex w-screen ">
        <SideBar selectedOption={SideBarOptions.Projects} />
        <div className="flex-grow flex flex-col h-full items-center min-w-0">
          <h1 className="w-11/12 text-4xl my-6 font-semibold text-center">
            Projets
          </h1>
          <div className="w-11/12 flex items-center justify-between mb-12 ">
            <Select
              value={selectedorganisation}
              defaultValue={-1}
              style={{ width: 200, background: "white" }}
              options={[
                { value: -1, label: "Toutes les organisations" },
                ...organisations.map((organisation) => ({
                  value: organisation.id_org,
                  label: organisation.title,
                })),
              ]}
              onChange={(value) => {
                setSelectedorganisation(value);
              }}
            />
            <div className="bg-gray-900 float-right justify-center align-middle rounded-xl flex">
              <button
                onClick={handleCreateProject}
                className="w-12 h-12 bg-inherit rounded-xl"
              >
                <PlusOutlined className="invert text-lg" />
              </button>
            </div>
          </div>

          <div
            className={
              (projects == undefined
                ? ""
                : projects.filter(
                    (x) =>
                      x.organisations_id_org == selectedorganisation ||
                      selectedorganisation == -1
                  ).length == 0
                ? "justify-center "
                : "") +
              "flex flex-col bg-[#E9E9E9]  border-[#707070] border-2 w-11/12 min-h-[35rem] rounded-lg overflow-x-hidden content-start items-center "
            }
          >
            <ProjectList />
          </div>
          <div className="h-5" />
        </div>
      </div>
    </>
  );
}

export default Projets;
