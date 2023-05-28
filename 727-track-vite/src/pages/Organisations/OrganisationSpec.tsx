import {
  Button,
  Input,
  message,
  Modal,
  notification,
  Spin,
  Tooltip,
  Upload,
} from "antd";
import React, { useEffect, useRef, useState } from "react";
import SideBar, { SideBarOptions } from "../../Components/Global/SideBar.js";
import { MessageInstance } from "antd/es/message/interface.js";
import { socket } from "../../App.js";
import OrgDataEntry from "../../Components/organisations/CreateOrg/OrgDataEntry.js";
import { BYTES_IN_MB, IMAGE_MAX_MB } from "../../../server-client/constants.js";
import { useNavigate, useParams } from "react-router-dom";
import { generateNotification, StoreNotification } from "../../utils/index.js";
import { notificationData } from "../../utils/frontend-types.js";
import ModifyOrgBody from "../../Components/organisations/OrgSpec/ModifyOrgBody.js";
import { organisation } from "../../../server-client/types.js";
import useNotification from "antd/es/notification/useNotification.js";

function OrganisationSpec() {
  const [awaitingServer, setAwaitingServer] = useState(true);
  const [defaultOrg, setDefaultOrg] = useState<organisation>();
  const { id } = useParams();
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    socket.emit("Application:GetOrganisationByID", id);
    socket.on("Application:ReceiveOrganisationByID", (org: organisation) => {
      setDefaultOrg(org);
      setAwaitingServer(false);
    });
    socket.on(
      "Application:ModifyOrganisation:ModifyOrganisationRes",
      (res: boolean) => {
        if (res) {
          StoreNotification(
            {
              title: "Organisation modifiée",
              description: `Organisation modifiée avec succès`,
              status: "success",
            },
            () => {
              navigate("/organisations");
            }
          );
        } else {
          generateNotification(api, {
            title: "Erreur interne",
            description:
              "L'organisation n'a pas pu être modifiée. Veuillez réessayer plus tard",
            status: "error",
          });
        }
      }
    );
  }, []);

  return (
    <>
      {contextHolder}
      <div className="flex w-screen">
        <SideBar selectedOption={SideBarOptions.None} />
        <div className="flex-grow flex flex-col h-full items-center">
          <h1 className="w-4/5 text-4xl my-6 h-[8.5rem] font-semibold text-center">
            Modifier organisation
          </h1>
          <div
            className={`
          flex flex-col bg-[#E9E9E9]  border-[#707070] border-2 w-11/12 min-h-[35rem] rounded-lg overflow-x-hidden 
          transition-all`}
          >
            {awaitingServer ? (
              <div className="w-full h-full flex-grow flex justify-center items-center">
                <Spin></Spin>
              </div>
            ) : defaultOrg == null ? (
              <div className="w-full flex flex-col items-center gap-5 flex-grow justify-center">
                <h1 className="text-xl font-bold">
                  Cette organisation n'existe pas ou vous n'y avez pas accès
                </h1>
                <div>
                  <Button
                    type="primary"
                    onClick={() => {
                      navigate("/organisations");
                    }}
                  >
                    Retour
                  </Button>
                </div>
              </div>
            ) : (
              <ModifyOrgBody organisation={defaultOrg} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default OrganisationSpec;
