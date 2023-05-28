import {
  Button,
  Input,
  message,
  Modal,
  notification,
  Tooltip,
  Upload,
} from "antd";
import React, { useEffect, useRef, useState } from "react";
import SideBar, { SideBarOptions } from "../../Components/Global/SideBar.js";
import { MessageInstance } from "antd/es/message/interface.js";
import { socket } from "../../App.js";
import OrgDataEntry from "../../Components/organisations/CreateOrg/OrgDataEntry.js";
import { BYTES_IN_MB, IMAGE_MAX_MB } from "../../../server-client/constants.js";
import { useNavigate } from "react-router-dom";
import { generateNotification, StoreNotification } from "../../utils/index.js";
import { notificationData } from "../../utils/frontend-types.js";
function selectImage(
  messageApi: MessageInstance,
  setFileName: React.Dispatch<React.SetStateAction<string>>,
  setImage: React.Dispatch<React.SetStateAction<File | undefined>>
) {
  let input = document.createElement("input");
  input.type = "file";
  input.accept = "image/png, image/gif, image/jpeg";
  input.onchange = () => {
    // you can use this method to get file and perform respective operations
    let files = Array.from(input.files ?? [])[0];
    if (Math.round(files.size / BYTES_IN_MB) > IMAGE_MAX_MB) {
      messageApi.error("Cette image est trop volumineuse!");
    } else {
      setFileName(files.name);
      setImage(files);
    }
  };
  input.click();
}

function sendRequest(query: string | undefined) {
  if (query == undefined) return;
  socket.emit(
    "Application:CreateOrganisation:RequestOrganisationExists",
    query
  );
}

function CreateOrganisation() {
  const [notificationApi, notificationContextHolder] =
    notification.useNotification();
  const [messageApi, messageContextHolder] = message.useMessage();
  const [fileName, setFileName] = useState("");
  const [titleQuery, setTitleQuery] = useState<string>();
  const [waitingForServerTitle, setWaitingForServerTitle] = useState<boolean>();
  const [orgNameExists, setOrgNameExists] = useState<boolean>(false);
  const [awaitingServer, setAwaitingServer] = useState<boolean>(false);

  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File>();

  const lastSetTitleQuery = useRef("");

  const navigate = useNavigate();

  const { TextArea } = Input;

  // Idée venant de https://stackoverflow.com/questions/53071774/reactjs-delay-onchange-while-typing
  useEffect(() => {
    setWaitingForServerTitle(true);
    setOrgNameExists(false);
    const ID = setTimeout(() => {
      sendRequest(titleQuery);
    }, 500);
    lastSetTitleQuery.current = titleQuery?.trim() ?? "";
    return () => clearTimeout(ID);
  }, [titleQuery]);

  useEffect(() => {
    socket.on(
      "Application:ModifyOrganisation:ModifyOrganisationRes",
      (res: boolean) => {}
    );

    socket.on(
      "Application:CreateOrganisation:ReceiveOrganisationExists",
      (orgName: string, exists: boolean) => {
        if (orgName != lastSetTitleQuery.current) {
          // change between query and reception
          return;
        }
        setOrgNameExists(exists);
        setWaitingForServerTitle(false);
      }
    );
    socket.on(
      "Application:CreateOrganisation:ServerReply",
      (worked: boolean) => {
        if (worked) {
          StoreNotification(
            {
              title: "Organisation créée",
              description: `Organisation "${lastSetTitleQuery.current}" créée `,
              status: "success",
            },
            () => {
              navigate("/organisations/");
            }
          );
        } else {
          generateNotification(notificationApi, {
            title: "Erreur interne",
            description: "L'organisation n'a pas été créée",
            status: "error",
          });
          setAwaitingServer(false);
        }
      }
    );
  }, []);

  const RequestCreateOrg = () => {
    if ((titleQuery ?? "") == "") {
      messageApi.error("Titre invalide");
    } else {
      setAwaitingServer(true);
      socket.emit(
        "Application:CreateOrganisation:CreateOrganisation",
        titleQuery,
        description,
        image
      );
    }
  };

  const buttonDisabledReason = function () {
    if (waitingForServerTitle && titleQuery != undefined) return null;
    if (
      !orgNameExists &&
      !waitingForServerTitle &&
      image != undefined &&
      titleQuery != ""
    )
      return null;
    return (
      <div>
        <p className="text-center">
          {`${
            orgNameExists
              ? "Cette organisation existe déjà"
              : image == undefined
              ? "Veuillez téléverser une image pour créer l'organisation"
              : titleQuery == "" || titleQuery == undefined
              ? "Veuillez donner un titre pour créer votre organisation"
              : "No"
          }`}
        </p>
      </div>
    );
  };

  return (
    <div className="flex w-screen ">
      {notificationContextHolder}
      {messageContextHolder}

      <SideBar selectedOption={SideBarOptions.None} />
      <div className="flex-grow flex flex-col h-full items-center">
        <h1 className="w-4/5 text-4xl my-6 h-[8.5rem] font-semibold text-center">
          Nouvelle organisation
        </h1>
        <div
          className={`
        flex flex-col bg-[#E9E9E9]  border-[#707070] border-2 w-11/12 min-h-[35rem] rounded-lg overflow-x-hidden 
         transition-all`}
        >
          <div className="flex w-full flex-col flex-grow">
            <OrgDataEntry
              setTitleQuery={setTitleQuery}
              setDescription={setDescription}
              setFileName={setFileName}
              setImage={setImage}
              orgNameExists={orgNameExists}
              messageApi={messageApi}
              fileName={fileName}
              image={image}
              selectImage={selectImage}
            />

            {/* Submit */}
            <div className="flex flex-grow justify-center items-center">
              <Tooltip title={buttonDisabledReason()} placement="top">
                <Button
                  className="block"
                  type="primary"
                  disabled={
                    orgNameExists ||
                    waitingForServerTitle ||
                    titleQuery == "" ||
                    image == undefined
                  }
                  onClick={() => {
                    RequestCreateOrg();
                  }}
                  loading={awaitingServer}
                >
                  Créer organisation
                </Button>
              </Tooltip>

              <Button
                className="mx-2"
                disabled={awaitingServer}
                onClick={() => navigate("/organisations")}
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateOrganisation;
