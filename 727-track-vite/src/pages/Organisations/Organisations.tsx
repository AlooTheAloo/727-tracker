import React, { useEffect, useRef, useState } from "react";
import { socket } from "../../App.js";
import {
  Button,
  Drawer,
  notification,
  RadioChangeEvent,
  Skeleton,
  Space,
} from "antd";
import SideBar, { SideBarOptions } from "../../Components/Global/SideBar.js";
import TacheListTache from "../../Components/Taches/TacheList/tacheListTache.js";
import { useLocation, useNavigate } from "react-router-dom";
import {
  organisationUserData,
  organisation as organisation,
  project,
  task,
  user,
} from "../../../server-client/types.js";
import TachesTopBar from "../../Components/Taches/TacheList/tachesTopBar.js";
import Cookies from "js-cookie";
import {
  generateNotification,
  getTimeDiff,
  timeDifInfo,
} from "../../utils/index";
import { notificationData } from "../../utils/frontend-types.js";
import OrgListOrg from "../../Components/organisations/OrgList/OrgListOrg.js";
import { PlusOutlined } from "@ant-design/icons";
import OrgList from "../../Components/organisations/OrgList.js";
import DrawerList from "../../Components/organisations/Drawer/DrawerList.js";

function Organisations() {
  const [api, contextHolder] = notification.useNotification();
  const navigate = useNavigate();
  const [organisations, setOrganisations] = useState<organisation[]>();
  const [organisationData, setOrganisationData] = useState<
    organisationUserData[]
  >([]);
  const [openDrawer, setOpenDrawer] = useState<boolean>();
  const [drawerUsers, setDrawerUsers] = useState<user[] | null>(null);
  const [drawerUserPerms, setDrawerUserPerms] = useState<(boolean | null)[]>(
    []
  );
  let [drawerPerms, setDrawerPerms] = useState<boolean>(false);
  let [isMember, setIsMember] = useState(false);
  let drawerOrgID = useRef<number>(-1);
  let drawerOrgName = useRef<string>("");

  function getOrganisations() {
    socket.emit("Application:Organisations:GetOrganisations");
  }

  function getIsMember() {
    socket.emit("Application:Organisations:GetIsMember", drawerOrgID.current);
  }

  function requestUsers(id_org: number, name_org: string) {
    setDrawerUsers(null);
    setOpenDrawer(true);
    drawerOrgName.current = name_org;
    drawerOrgID.current = id_org;
    getIsMember();
    socket.emit("Application:Organisations:GetUsers", id_org);
  }

  function handleCreateOrganisation() {
    navigate("/CreateOrganisation");
  }

  function createListeners() {
    socket.on(
      "Application:Organisations:ReceiveOrganisations",
      (
        organisations: organisation[],
        organisationsUserData: organisationUserData[]
      ) => {
        setOrganisations(organisations);
        setOrganisationData(organisationsUserData);
      }
    );

    socket.on(
      "Application:Organisations:ReceiveUsers",
      (
        users: user[],
        hasPerms: boolean,
        org_id: number,
        userPerms: (boolean | null)[]
      ) => {
        if (org_id != drawerOrgID.current) {
          return;
        }
        if (users == null) {
          generateNotification(api, {
            title: "Erreur interne",
            description:
              "Les utilisateurs ne peuvent pas être affichés, réessayez plus tard.",
            status: "error",
          });
        } else {
          if (!hasPerms) {
            socket.emit("Application:Organisations:CheckAdmin");
          } else {
            setDrawerPerms(hasPerms);
          }
          setDrawerUsers(users);
          setDrawerUserPerms(userPerms);
        }
      }
    );

    socket.on(
      "Application:Organisations:ReceiveIsMember",
      (member: boolean) => {
        setIsMember(member);
      }
    );

    socket.on("Application:Organisations:ReceiveAdmin", (admin: boolean) => {
      setDrawerPerms(admin);
    });
  }

  useEffect(() => {
    const notif: string | null = localStorage.getItem("showNotification");

    if (notif != null) {
      const parsedNotif: notificationData = JSON.parse(notif);
      generateNotification(api, parsedNotif);
    }
    localStorage.removeItem("showNotification");
    if (socket == null) return;
    createListeners();
    getOrganisations();
    getIsMember();
  }, []);

  return (
    <>
      <Drawer
        title="Utilisateurs"
        placement="right"
        open={openDrawer}
        onClose={() => {
          setOpenDrawer(false);
        }}
      >
        <DrawerList
          org_id={drawerOrgID.current}
          users={drawerUsers}
          hasPerms={drawerPerms}
          isMember={isMember}
          notificationApi={api}
          drawerUserPerms={drawerUserPerms}
          org_name={drawerOrgName.current}
        />
      </Drawer>

      <div className="flex w-screen ">
        {contextHolder}
        <SideBar selectedOption={SideBarOptions.Organisations} />
        <div className="flex-grow flex flex-col h-full items-center">
          <h1 className="w-11/12 text-4xl my-6 font-semibold text-center">
            Organisations
          </h1>
          <div className="w-11/12 flex items-center justify-end mb-12 ">
            <div className="bg-gray-900 rounded-xl flex">
              <button
                onClick={handleCreateOrganisation}
                className="w-12 h-12 bg-inherit rounded-xl"
              >
                <PlusOutlined className="invert text-lg" />
              </button>
            </div>
          </div>

          <div
            className={
              "flex bg-[#E9E9E9]  border-[#707070] border-2 w-11/12 min-h-[35rem] rounded-lg overflow-x-hidden content-start"
            }
          >
            <OrgList
              organisations={organisations}
              organisationData={organisationData}
              contextHolder={contextHolder}
              handleCreateOrganisation={handleCreateOrganisation}
              requestUsers={requestUsers}
            />
          </div>
          <div className="h-5 w-full" />
        </div>
      </div>
    </>
  );
}

export default Organisations;
