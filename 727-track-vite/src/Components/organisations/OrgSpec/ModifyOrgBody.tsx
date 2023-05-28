import React, { useEffect, useRef, useState } from "react";
import OrgDataEntry from "../CreateOrg/OrgDataEntry.js";
import { Button, Input, Tooltip, message, notification } from "antd";
import { MessageInstance } from "antd/es/message/interface.js";
import {
  BYTES_IN_MB,
  IMAGE_MAX_MB,
} from "../../../../server-client/constants.js";
import { socket } from "../../../App.js";
import { useNavigate } from "react-router-dom";
import {
  StoreNotification,
  generateNotification,
} from "../../../utils/index.js";
import { notificationData } from "../../../utils/frontend-types.js";
import { organisation } from "../../../../server-client/types.js";
import ModifyOrgDataEntry from "./ModifyOrgDataEntry.js";

interface ModifyOrgBodyProps {
  organisation: organisation;
}

function ModifyOrgBody(props: ModifyOrgBodyProps) {
  const [notificationApi, notificationContextHolder] = notification.useNotification();
  const [fileName, setFileName] = useState("");
  const [titleQuery, setTitleQuery] = useState<string>();
  const [waitingForServerTitle, setWaitingForServerTitle] = useState<boolean>();
  const [orgNameExists, setOrgNameExists] = useState<boolean>(false);
  const [awaitingServer, setAwaitingServer] = useState<boolean>(false);
  const [hasModification, setHasModification] = useState(false);
  const [messageApi, messageContextHolder] = message.useMessage();
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File>();
  const navigate = useNavigate();

  const lastSetTitleQuery = useRef("");

  const { TextArea } = Input;

  const sendRequest = (query: string | undefined) => {
    if (query == undefined) return;
    socket.emit(
      "Application:CreateOrganisation:RequestOrganisationExists",
      query
    );
  };

  // Idée venant de https://stackoverflow.com/questions/53071774/reactjs-delay-onchange-while-typing
  useEffect(() => {
    if (titleQuery == props.organisation.title) {
      // no need to check
      setWaitingForServerTitle(false);
      setOrgNameExists(false);
      lastSetTitleQuery.current = titleQuery?.trim() ?? "";
      return;
    }
    setWaitingForServerTitle(true);
    setOrgNameExists(false);
    const ID = setTimeout(() => {
      sendRequest(titleQuery);
    }, 500);
    lastSetTitleQuery.current = titleQuery?.trim() ?? "";
    return () => clearTimeout(ID);
  }, [titleQuery]);

  useEffect(() => {
    setTitleQuery(props.organisation.title);
    setDescription(props.organisation.description);

    socket.on(
      "Application:CreateOrganisation:ReceiveOrganisationExists",
      (orgName: string, exists: boolean) => {
        console.log(orgName + " " + lastSetTitleQuery.current);
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

  const buttonDisabledReason = function () {
    if (waitingForServerTitle && titleQuery != undefined) return null;
    if (
      !orgNameExists &&
      !waitingForServerTitle &&
      image != undefined &&
      titleQuery != ""
    )
      return null;
    if (props.organisation.title == titleQuery) return null;
    if (!orgNameExists && titleQuery != "" && titleQuery != undefined)
      return null;
    return (
      <div>
        <p className="text-center">
          {`${
            orgNameExists
              ? "Cette organisation existe déjà"
              : titleQuery == "" || titleQuery == undefined
              ? "Veuillez donner un titre pour confirmer vos changements"
              : ""
          }`}
        </p>
      </div>
    );
  };

  const RequestModifyOrg = () => {
    if ((titleQuery ?? "") == "") {
      messageApi.error("Titre invalide");
    } else {
      setAwaitingServer(true);
      socket.emit(
        "Application:ModifyOrganisation:ModifyOrganisation",
        props.organisation.id_org,
        titleQuery,
        description,
        image
      );
    }
  };

  return (
    <>
      {notificationContextHolder}
      {messageContextHolder}

      <div className="flex w-full flex-col flex-grow">
        <ModifyOrgDataEntry
          title={props.organisation.title}
          description={props.organisation.description}
          setTitleQuery={setTitleQuery}
          setDescription={setDescription}
          setFileName={setFileName}
          setImage={setImage}
          setHasModif={setHasModification}
          orgNameExists={orgNameExists}
          messageApi={messageApi}
          fileName={fileName}
          image={image}
          selectImage={selectImage}
        />

        {/* Submit */}
        <div className="flex flex-grow justify-center items-center">
          <Tooltip title={buttonDisabledReason()} placement="top">
            {hasModification ? (
              <Button
                className={`${hasModification ? "block" : "hidden "}`}
                type="primary"
                disabled={
                  orgNameExists || waitingForServerTitle || titleQuery == ""
                }
                onClick={() => {
                  RequestModifyOrg();
                }}
                loading={awaitingServer}
              >
                Modifier Organisation
              </Button>
            ) : (
              <></>
            )}
          </Tooltip>

          <Button
            type={hasModification ? "default" : "primary"}
            className="mx-2"
            disabled={awaitingServer}
            onClick={() => navigate("/organisations")}
          >
            Retour
          </Button>
        </div>
      </div>
    </>
  );
}

export default ModifyOrgBody;
