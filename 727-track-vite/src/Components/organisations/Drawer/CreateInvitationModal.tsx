import {
  Button,
  Checkbox,
  Dropdown,
  Input,
  Modal,
  Select,
  Space,
  Spin,
} from "antd";
import React, { useEffect, useRef, useState } from "react";
import { socket } from "../../../App.js";
import { RandomGen, generateNotification } from "../../../utils/index.js";
import { NotificationInstance } from "antd/es/notification/interface.js";
import { pagespeedonline } from "googleapis/build/src/apis/pagespeedonline/index.js";
import { CopyOutlined } from "@ant-design/icons";
interface CreateInvitationModalProps {
  org_id: number;
  modalOpened: boolean;
  setModalOpened: React.Dispatch<React.SetStateAction<boolean>>;
  notificationAPI: NotificationInstance;
}

enum pageStates {
  FormInput,
  AwaitingServer,
  ShowLink,
}

function CreateInvitationModal(props: CreateInvitationModalProps) {
  const [pageState, setPageState] = useState(pageStates.FormInput);
  const [adminPerms, setAdminPerms] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const outgoingRequestID = useRef(0);

  const expire = useRef(-1);
  const useTimes = useRef(-1);

  const handleGenerateLink = () => {
    const id = RandomGen(0, 1e6);
    outgoingRequestID.current = id;
    socket.emit(
      "Application:Organisations:CreateInviteLink",
      props.org_id,
      useTimes.current,
      expire.current,
      adminPerms,
      id
    );
    setPageState(pageStates.AwaitingServer);
  };

  useEffect(() => {
    setPageState(pageStates.FormInput);
  }, [props.modalOpened]);

  useEffect(() => {
    socket.on(
      "Application:Organisations:CreateInviteLinkStatus",
      (status: boolean, link: string, requestID: number) => {
        console.log(
          "request id is " +
            requestID +
            ", but outgoingRequestID is " +
            outgoingRequestID.current
        );
        if (requestID != outgoingRequestID.current) return;

        if (status) {
          setPageState(pageStates.ShowLink);
          setGeneratedLink(link);
        } else {
          setPageState(pageStates.FormInput);
          generateNotification(props.notificationAPI, {
            title: "Erreur interne",
            description:
              "Le lien n'a pas pu être généré, veuillez réessayer plus tard",
            status: "error",
          });
        }
      }
    );
  }, []);

  return (
    <Modal
      open={props.modalOpened}
      width={1000}
      onCancel={() => {
        props.setModalOpened(false);
      }}
      footer={
        <>
          <Button
            className={`${pageState == pageStates.FormInput ? "" : "hidden"}`}
            type="primary"
            onClick={handleGenerateLink}
          >
            Générer
          </Button>
        </>
      }
    >
      <div className={`${pageState == pageStates.FormInput ? "" : "hidden"}`}>
        <p className="font-semibold text-xl">Générer un lien d'invitaion</p>
        <div className="flex flex-col">
          <div className="flex sm:flex-row flex-col gap-5 sm:items-start items-center mt-3">
            <div className="flex flex-col w-full sm:w-1/2">
              <div>Expire après</div>

              <Select
                onChange={(value) => {
                  expire.current = value;
                }}
                defaultValue={-1}
                options={[
                  { value: 30, label: "30 minutes" },
                  { value: 60, label: "1 heure" },
                  { value: 360, label: "6 heures" },
                  { value: 1440, label: "1 jour" },
                  { value: 10080, label: "7 jours" },
                  { value: -1, label: "Jamais" },
                ]}
              />
            </div>

            <div className="flex flex-col w-full sm:w-1/2">
              <div>Nombre maximum d'utilisations</div>

              <Select
                onChange={(value) => {
                  useTimes.current = value;
                }}
                defaultValue={-1}
                options={[
                  { value: -1, label: "Illimité" },
                  { value: 1, label: "1 utilisation" },
                  { value: 5, label: "5 utilisations" },
                  { value: 10, label: "10 utilisations" },
                  { value: 25, label: "25 utilisations" },
                  { value: 50, label: "50 utilisations" },
                  { value: 100, label: "100 utilisations" },
                ]}
              ></Select>
            </div>
          </div>

          <Checkbox
            className="mt-2"
            onChange={(value) => {
              console.log("admin perms set to " + value.target.checked);
              setAdminPerms(value.target.checked);
            }}
          >
            Donner les permissions d'administrateur
          </Checkbox>
        </div>
      </div>

      <div
        className={`${
          pageState == pageStates.AwaitingServer
            ? "mt-5 w-full flex justify-center "
            : "hidden"
        }`}
      >
        <Spin />
      </div>

      <div
        className={`${
          pageState == pageStates.ShowLink ? "mt-5 w-full  " : "hidden"
        }`}
      >
        <p className="font-semibold text-lg">Lien d'invitation créé!</p>
        <Space.Compact style={{ width: "100%" }}>
          <Input
            value={`${window.location.origin}/invite/${generatedLink}`}
            disabled
          />
          <Button
            type="primary"
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/invite/${generatedLink}`
              );
            }}
            icon={<CopyOutlined />}
          />
        </Space.Compact>
      </div>
    </Modal>
  );
}

export default CreateInvitationModal;
