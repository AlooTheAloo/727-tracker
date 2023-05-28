import { Avatar } from "antd";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  organisation,
  organisationUserData,
} from "../../../../server-client/types";
import OrgListOrgDataComponent from "./OrgListOrg/OrgListOrgDataComponent.js";

interface OrgListOrgProps {
  organisation: organisation;
  organisationData: organisationUserData;
  onClickUsers: () => void;
}

function OrgListOrg(props: OrgListOrgProps) {
  const navigate = useNavigate();

  return (
    <div
      className={
        "w-[90%] h-fit flex flex-col lg:flex-row justify-between mt-4 " +
        "bg-white rounded-lg transition-colors"
      }
    >
      <div className="w-full lg:w-2/3 lg:h-full flex lg:flex-row flex-col items-center lg:items-start ">
        {/* Image here */}
        <div className="h-full w-2/3 lg:w-[10.25rem] lg:mb-0 my-2 lg:my-0 flex items-center justify-center">
          <Avatar
            onClick={() => {
              if (!props.organisationData.isOwner) return;
              navigate(`/organisation/${props.organisation.id_org}`);
            }}
            src={`data:image/gif;base64,${props.organisationData.image}`}
            className={`${
              props.organisationData.isOwner ? "cursor-pointer" : ""
            } bg-cover rounded-xl w-36 h-36 `}
          />
        </div>

        {/* Title + description here*/}
        <div className="lg:h-full w-[50vw] flex-grow lg:w-[5rem] flex flex-col">
          <p className="lg:mx-4 mt-4 text-3xl font-bold lg:text-left text-center w-[calc(100%-1rem)] ">
            {props.organisation.title}
          </p>
          <div className="mx-4 mb-4 break-words">
            <p className="lg:text-left text-center">
              {props.organisation.description}
            </p>
          </div>
        </div>
      </div>
      {/* Data about org */}
      <div className="p-4 lg:w-80 flex flex-col justify-center items-center">
        <OrgListOrgDataComponent
          title="Projet"
          description="Dont vous faites partie"
          colorClass="bg-blue-300"
          data={props.organisationData.projects}
          clickEvent={() => {
            navigate("/projectlist", {
              state: { selectedorganisation: props.organisation.id_org },
            });
          }}
        />

        <OrgListOrgDataComponent
          title="Événement"
          description="Aujourd'hui"
          colorClass="bg-blue-500"
          data={props.organisationData.events}
          clickEvent={() => {
            navigate("/events");
          }}
        />

        <OrgListOrgDataComponent
          title="Utilisateur"
          description="Dans l'organisation"
          colorClass="bg-blue-700"
          data={props.organisationData.userCount}
          clickEvent={() => {
            props.onClickUsers();
          }}
        />
      </div>
    </div>
  );
}

export default OrgListOrg;
