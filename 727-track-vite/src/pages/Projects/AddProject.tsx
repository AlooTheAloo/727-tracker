import React, { useEffect, useState } from "react";
import { socket } from "../../App.js";
import SideBar, { SideBarOptions } from "../../Components/Global/SideBar.js";
import { Button, notification, Select, Skeleton } from "antd";
import { user, project, organisation } from "../../../server-client/types.js";
import { useLocation, useNavigate } from "react-router-dom";
import CreateProjectForm from "../../Components/Projets/CreateProjectForm";
import CreateProjectSkeleton from "../../Components/Projets/CreateProjectSkeleton";
import { notificationData } from "../../utils/frontend-types.js";
import { StoreNotification, generateNotification } from "../../utils/index.js";

function CreateProject() {
  const [api, contextHolder] = notification.useNotification();
  const [organisations, setorganisations] = useState<organisation[]>([]);
  const [selectedorganisation, setSelectedorganisation] = useState<
    number | null
  >(null); // -1 (No project), null (Waiting)
  const [loaded, setLoaded] = useState<boolean>(false);
  const [awaitingServer, setAwaitingServer] = useState<boolean>(false);
  const [collaborators, setCollaborators] = useState<user[]>([]);
  const { state: pageState } = useLocation();

  const handleorganisationChange = (value: number, option: any) => {
    setSelectedorganisation(value);
    setCollaborators([]);
  };
  const getOrganisations = () => {
    socket.emit("Application:CreateProject:Getorganisations");
  };

  const navigate = useNavigate();
  let projectName: string = "";
  useEffect(() => {
    getOrganisations();
    socket.on(
      "Application:CreateProject:Receiveorganisations",
      (organisations: organisation[]) => {
        setLoaded(true);
        setorganisations(organisations);
        if (pageState != null) {
          if (pageState.selectedorganisation != -1)
            setSelectedorganisation(pageState.selectedorganisation);
          else setSelectedorganisation(null);
        }
      }
    );

    socket.on(
      "Application:CreateProject:CreatedProject",
      (worked: boolean, title: string) => {
        if (!worked) {
          generateNotification(api, {
            title: "Erreur inconnue ",
            description: `Le projet ${projectName} n'a pas été créé :(`,
            status: "error",
          });
          setAwaitingServer(false);
        } else {
          StoreNotification(
            {
              title: "Projet créé avec succès!!!",
              description: `Projet ${projectName} créé avec succès`,
              status: "success",
            },
            () => {
              navigate("/projectlist");
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
    organisationID: number | null
  ) {
    const current_date = new Date();
    const createdProject: project = {
      id_project: 0,
      title: title,
      description: description,
      date_created: current_date,
      date_modified: current_date,
      date_todo: due_date,
      date_started: undefined,
      date_end: undefined,
      status: "Waiting",
      organisations_id_org: organisationID,
      user_creator_id: "0",
    };
    projectName = title;
    socket.emit(
      "Application:CreateProject:CreateProject",
      createdProject,
      collaborators
    );
  }

  function onCancel() {
    navigate("/projectlist");
  }

  return (
    <>
      {contextHolder}
      <div className="flex w-screen">
        <SideBar selectedOption={SideBarOptions.None} />
        <div className="flex-grow flex flex-col h-full items-center">
          <h1 className="w-11/12 text-4xl my-6 font-semibold text-center">
            Nouveau projet
          </h1>
          <div className="w-11/12 justify-center flex">
            <Select
              className="absolute"
              placeholder="Sélectionner une organisation"
              style={{ width: 200, display: loaded ? "block" : "none" }}
              options={[
                { value: -1, label: "Aucune organisation" },
                ...organisations.map((organisation) => ({
                  value: organisation.id_org,
                  label: organisation.title,
                })),
              ]}
              onChange={handleorganisationChange}
              value={selectedorganisation}
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
              (selectedorganisation == null || selectedorganisation == -2
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
              <CreateProjectSkeleton />
            </div>
            <div
              className={
                (selectedorganisation == null && loaded
                  ? "block "
                  : "hidden ") + " w-full"
              }
            >
              <p className="text-center">
                Aucune organisation sélectionnée! <br />
                Sélectionnez en une ou
                <Button
                  className="inline-block"
                  style={{ paddingLeft: 5, paddingTop: 0, paddingRight: 5 }}
                  type="link"
                  onClick={() => setSelectedorganisation(-1)}
                >
                  Créez un projet sans organisation
                </Button>
              </p>
            </div>
            <div
              className={
                (selectedorganisation == null ? "hidden " : " ") +
                "flex flex-col w-full h-full flex-grow "
              }
            >
              <CreateProjectForm
                collaborators={collaborators}
                setCollaborators={setCollaborators}
                onSubmit={onSubmit}
                onCancel={onCancel}
                organisationID={selectedorganisation}
                awaitingServer={awaitingServer}
                setAwaitingServer={setAwaitingServer}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default CreateProject;
