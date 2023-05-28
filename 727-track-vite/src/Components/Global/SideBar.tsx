import React, { useEffect, useState, useContext } from "react";
import {
  MenuOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  ProjectOutlined,
  TeamOutlined,
  CalendarOutlined,
  BellOutlined,
} from "@ant-design/icons";

import SideBarItem from "./SideBar/SideBarItem.js";
import ProfileItem from "./SideBar/ProfileItem.js";

import { useNavigate, redirect } from "react-router-dom";

import { GlobalContext } from "./context/GlobalContext.js";
import { socket } from "../../App.js";
import { user } from "../../../server-client/types.js";
import anonymous from "../../assets/Sidebar/anonymous.jpg";
export enum SideBarOptions {
  Tasks,
  Projects,
  Organisations,
  Notifications,
  Home,
  Events,
  None,
}
interface SideBarProps {
  selectedOption: SideBarOptions;
}

function SideBar(props: SideBarProps) {
  const navigate = useNavigate();
  const { collapsed, setCollapsed, pfp, setPfp, userName, setUserName } =
    useContext(GlobalContext);

  useEffect(() => {
    if (pfp == undefined || userName == undefined) {
      // Ask server if we don't know data
      socket.emit("Application:Sidebar:GetUserInfo");
      socket.on("Application:Sidebar:ReceiveUserInfo", (userData: user) => {
        if (userData.profile_picture == "") {
          setPfp(anonymous);
        } else setPfp(userData.profile_picture);

        setUserName(userData.username);
      });
    }
  }, []);

  return (
    <div className="">
      <div className="w-16" />
      <div
        id="sidebar"
        className={
          "bg-black fixed w-screen h-screen z-[5] transition-all " +
          (collapsed
            ? "opacity-0 pointer-events-none"
            : "opacity-30 pointer-events-auto")
        }
        onClick={() => {
          setCollapsed(true);
        }}
      ></div>
      <div
        className="fixed h-screen bg-[#0d1520] z-10 transition-all flex flex-col gap-2"
        style={{ width: collapsed ? "4rem" : "16rem" }}
      >
        <div className="flex flex-col justify-between h-full ">
          <div>
            <MenuOutlined
              onClick={() => {
                setCollapsed(!collapsed);
              }}
              className="text-white hover:bg-[#1a2d47] p-3 m-3 rounded-xl transition-all animate"
            />
            <hr className="border-gray-700 mx-5 border-[1px]" />
            <div className="mt-5" />
            {/* Home */}
            <SideBarItem
              itemName="Accueil"
              icon={<DashboardOutlined />}
              collapsed={collapsed}
              selected={props.selectedOption == SideBarOptions.Home}
              onClick={() => {
                navigate("/home");
              }}
            />

            {/* Tâches */}
            <SideBarItem
              itemName="Tâches"
              icon={<CheckCircleOutlined />}
              collapsed={collapsed}
              selected={props.selectedOption == SideBarOptions.Tasks}
              onClick={() => {
                navigate("/tasklist");
              }}
            />

            {/* Organisations */}
            <SideBarItem
              itemName="Projets"
              icon={<ProjectOutlined />}
              collapsed={collapsed}
              selected={props.selectedOption == SideBarOptions.Projects}
              onClick={() => {
                navigate("/projectlist");
              }}
            />

            {/* Organisations */}
            <SideBarItem
              itemName="Organisations"
              icon={<TeamOutlined />}
              collapsed={collapsed}
              selected={props.selectedOption == SideBarOptions.Organisations}
              onClick={() => {
                navigate("/organisations");
              }}
            />

            {/* Events */}
            <SideBarItem
              itemName="Événements"
              icon={<CalendarOutlined />}
              collapsed={collapsed}
              selected={props.selectedOption == SideBarOptions.Events}
              onClick={() => {
                navigate("/events");
              }}
            />

            {/* Notifications */}
            <SideBarItem
              itemName="Notifications"
              icon={<BellOutlined />}
              collapsed={collapsed}
              selected={props.selectedOption == SideBarOptions.Notifications}
              onClick={() => {
                navigate("/notifications");
              }}
            />
          </div>
          <div>
            <hr className="border-gray-700 mx-5 border-[1px] mt-3" />

            <ProfileItem name={userName} pfp={pfp} collapsed={collapsed} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SideBar;
