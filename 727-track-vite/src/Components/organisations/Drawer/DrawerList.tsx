import { Avatar, Button, List, Modal, Skeleton, notification } from "antd";
import React, { useEffect, useState } from "react";
import { user } from "../../../../server-client/types.js";
import CreateInvitationModal from "./CreateInvitationModal.js";
import { NotificationInstance } from "antd/es/notification/interface.js";
import { socket } from "../../../App.js";
import {
  StoreNotification,
  generateNotification,
} from "../../../utils/index.js";
import useNotification from "antd/es/notification/useNotification.js";
import { useNavigate } from "react-router-dom";

const { confirm } = Modal;

interface DrawerListProps {
  users: user[] | null;
  hasPerms: boolean;
  isMember: boolean;
  org_id: number;
  notificationApi: NotificationInstance;
  drawerUserPerms: (boolean | null)[]; // Perms for every user
  org_name: string;
}

function DrawerList(props: DrawerListProps) {
  const [modalOpened, setModalOpened] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const navigate = useNavigate();

  const showLeaveConfirm = () => {
    confirm({
      title: `Voulez-vous vraiment quitter '${props.org_name}' ?`,
      content: `Vous ne pourrez pas retourner à moins d'avoir un nouveau lien d'invitation.`,
      okText: "Quitter",
      okType: "danger",
      cancelText: "Annuler",
      onOk() {
        socket.emit(
          "Application:Organisations:LeaveOrganisation",
          props.org_id
        );
      },
    });
  };

  const showDeleteConfirm = () => {
    confirm({
      title: `Voulez-vous vraiment supprimer '${props.org_name}'`,
      content: `Cette action ne peut pas être renversée`,
      okText: "Supprimer",
      okType: "danger",
      cancelText: "Annuler",
      onOk() {
        socket.emit(
          "Application:Organisations:DeleteOrganisation",
          props.org_id
        );
      },
    });
  };

  useEffect(() => {
    socket.on(
      "Application:Organisations:LeaveOrganisationRes",
      (res: boolean) => {
        if (res) {
          StoreNotification(
            {
              title: "Organisation quittée",
              description: `Organisation '${props.org_name}' quittée avec succès`,
              status: "success",
            },
            () => {
              window.location.href = window.location.href;
            }
          );
        } else {
          generateNotification(api, {
            title: "Erreur interne",
            description:
              "Nous n'avons pas pu vous faire quitter l'organisation. Réessayez plus tard",
            status: "error",
          });
        }
      }
    );

    socket.on(
      "Application:Organisations:DeleteOrganisationRes",
      (res: boolean) => {
        if (res) {
          StoreNotification(
            {
              title: "Organisation supprimée",
              description: `L'organisation '${props.org_name}' supprimée avec succès`,
              status: "success",
            },
            () => {
              window.location.reload();
            }
          );
        } else {
          generateNotification(api, {
            title: "Erreur interne",
            description:
              "L'organisation n'a pas été supprimée. Réessayez plus tard",
            status: "error",
          });
        }
      }
    );

    socket.on(
      "Application:Organisations:KickUserFromOrgRes",
      (res: boolean, user_name: string) => {
        if (res) {
          StoreNotification(
            {
              title: "Utilisateur expulsé",
              description: `L'utilisateur '${user_name}' a été expulsé de '${props.org_name}'`,
              status: "success",
            },
            () => {
              window.location.href = window.location.href;
            }
          );
        } else {
          generateNotification(api, {
            title: "Erreur interne",
            description:
              "L'utilisateur n'a pas pu être êxplusé. Veuillez réessayer plus tard",
            status: "error",
          });
        }
      }
    );
  }, []);

  return (
    <>
      {contextHolder}
      <CreateInvitationModal
        notificationAPI={props.notificationApi}
        org_id={props.org_id}
        modalOpened={modalOpened}
        setModalOpened={setModalOpened}
      />
      <div className="h-full flex flex-col">
        <List
          className={`flex-grow overflow-y-auto`}
          loading={props.users == null}
          itemLayout="horizontal"
          dataSource={props.users == null ? undefined : [...props.users]}
          renderItem={(item, index) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  danger
                  className={
                    props.hasPerms && (!props.drawerUserPerms[index])
                      ? ""
                      : "hidden"
                  }
                  onClick={() => {
                    socket.emit(
                      "Application:Organisations:KickUserFromOrg",
                      item.id_user,
                      props.org_id
                    );
                  }}
                >
                  {" "}
                  Expulser{" "}
                </Button>,
              ]}
            >
              <Skeleton
                avatar
                title={false}
                loading={props.users == null}
                active
              >
                <List.Item.Meta
                  avatar={<Avatar src={item.profile_picture} />}
                  title={<p className="mt-[0.35rem]">{item.username}</p>}
                />
              </Skeleton>
            </List.Item>
          )}
        />
        <div className={`h-fit`}>
          <Button
            block
            type="primary"
            onClick={() => {
              setModalOpened(true);
            }}
            className={`${
              props.users == null || !props.hasPerms ? "hidden" : "mt-2"
            }`}
          >
            Générer lien d'invitation
          </Button>

          <Button
            block
            type="primary"
            onClick={() => {
              showLeaveConfirm();
            }}
            className={`${
              props.users == null || !props.isMember ? "hidden" : "mt-2"
            }`}
            danger
          >
            Quitter l'organisation
          </Button>

          <Button
            danger
            block
            type="primary"
            onClick={() => {
              showDeleteConfirm();
            }}
            className={`${
              props.users == null || !props.hasPerms ? "hidden" : "mt-2"
            }`}
          >
            Supprimer l'organisation
          </Button>
        </div>
      </div>
    </>
  );
}

export default DrawerList;
