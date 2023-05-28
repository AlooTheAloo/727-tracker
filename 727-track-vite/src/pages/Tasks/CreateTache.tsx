import React, { useEffect, useState } from "react";
import { socket } from "../../App.js";
import SideBar, { SideBarOptions } from "../../Components/Global/SideBar.js";
import { Button, notification, Select, Skeleton } from "antd";
import { project, user } from "../../../server-client/types.js";
import { useLocation, useNavigate } from "react-router-dom";
import CreateTacheForm from "../../Components/Taches/CreateTache/createTacheForm.js";
import CreateTacheSkeleton from "../../Components/Taches/CreateTache/createTacheSkeleton.js";
import { notificationData } from "../../utils/frontend-types.js";
import { StoreNotification, generateNotification } from "../../utils/index";

function CreateTache() {
  const [api, contextHolder] = notification.useNotification();
  const [awaitingServer, setAwaitingServer] = useState<boolean>(false);
  const [projects, setProjects] = useState<project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null); // -1 (No project), null (Waiting)
  const [loaded, setLoaded] = useState<boolean>(false);
  const [collaborators, setCollaborators] = useState<user[]>([]); // Selected users for this form
  const { state: pageState } = useLocation();

  const navigate = useNavigate();

  const handleProjectChange = (value: number, option: any) => {
    setSelectedProject(value);
    setCollaborators([]);
  };

  const getProjects = () => {
    socket.emit("Application:CreateTache:GetProjects");
  };

  useEffect(() => {
    getProjects();
    socket.on(
      "Application:CreateTache:ReceiveProjects",
      (projects: project[]) => {
        setLoaded(true);
        setProjects(projects);
        if (pageState != null) {
          if (pageState.selectedProject != -1)
            setSelectedProject(pageState.selectedProject);
          else setSelectedProject(null);
        }
      }
    );

    socket.on(
      "Application:CreateTache:CreatedTache",
      (worked: boolean, title: string) => {
        if (!worked) {
          generateNotification(api, {
            title: "Erreur interne",
            description:
              "Il y a eu une erreur en créant la tâche. Veuillez réessayer plus tard",
            status: "error",
          });
          setAwaitingServer(false);
        } else {
          StoreNotification(
            {
              title: "Tâche créée",
              description: `La tâche "${title}" a été créée!!`,
              status: "success",
            },
            () => {
              navigate("/tasklist");
            }
          );
        }
      }
    );
  }, []);

  function onSubmit(
    title: string,
    description: string,
    due_date: Date | undefined,
    collaborators: user[],
    projectID: number | undefined
  ) {
    socket.emit(
      "Application:CreateTache:CreateTache",
      title,
      description,
      due_date?.toString(),
      collaborators,
      projectID
    );
  }

  function onCancel() {
    navigate("/tasklist");
  }

  return (
    <div className="flex w-screen">
      {contextHolder}
      <SideBar selectedOption={SideBarOptions.None} />
      <div className="flex-grow flex flex-col h-full items-center">
        <h1 className="w-4/5 text-4xl my-6 font-semibold text-center">
          Nouvelle tâche
        </h1>
        <div className="w-11/12 justify-center flex">
          <Select
            className="absolute"
            placeholder="Sélectionner un projet"
            style={{ width: 200, display: loaded ? "block" : "none" }}
            options={[
              { value: -1, label: "Aucun projet" },
              ...projects.map((project) => ({
                value: project.id_project,
                label: project.title,
              })),
            ]}
            onChange={handleProjectChange}
            value={selectedProject}
          />

          <Skeleton.Button
            active
            style={{
              width: "200px",
              marginLeft: "-100px",
              display: loaded ? "none" : "block",
              position: "absolute",
            }}
          ></Skeleton.Button>
        </div>
        <div
          className={
            (selectedProject == null || selectedProject == -2
              ? "justify-center "
              : "justify-start ") +
            "flex flex-col bg-[#E9E9E9]  border-[#707070] border-2 w-11/12 min-h-[35rem] rounded-lg overflow-x-hidden " +
            "mt-24 transition-all "
          }
        >
          <div
            className={
              (loaded ? "hidden" : "block") +
              " w-full h-full flex-grow flex flex-col"
            }
          >
            <CreateTacheSkeleton />
          </div>
          <div
            className={
              (selectedProject == null && loaded ? "block " : "hidden ") +
              " w-full"
            }
          >
            <p className="text-center">
              Aucun projet sélectionné! <br />
              Sélectionnez en un ou
              <Button
                className="inline-block"
                style={{ paddingLeft: 5, paddingTop: 0, paddingRight: 5 }}
                type="link"
                onClick={() => setSelectedProject(-1)}
              >
                Créez une tâche sans projet
              </Button>
            </p>
          </div>
          <div
            className={
              (selectedProject == null ? "hidden " : " ") +
              "flex flex-col w-full h-full flex-grow "
            }
          >
            <CreateTacheForm
              collaborators={collaborators}
              setCollaborators={setCollaborators}
              onSubmit={onSubmit}
              onCancel={onCancel}
              projectID={selectedProject}
              awaitingServer={awaitingServer}
              setAwaitingServer={setAwaitingServer}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateTache;
