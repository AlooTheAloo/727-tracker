import { Button, Skeleton } from "antd";
import React from "react";
import {
  organisation,
  organisationUserData,
} from "../../../server-client/types.js";
import OrgListOrg from "./OrgList/OrgListOrg.js";

interface OrgListProps {
  organisations: organisation[] | undefined;
  organisationData: organisationUserData[];
  contextHolder: React.ReactElement<
    any,
    string | React.JSXElementConstructor<any>
  >;
  requestUsers: (orgID: number, orgName: string) => void;
  handleCreateOrganisation: () => void;
}

function OrgList(props: OrgListProps) {
  if (props.organisations == undefined) {
    return (
      <div className="w-full h-full ">
        <div className="w-full flex justify-center h-full ">
          <div className={"w-[92%] h-full"}>
            {
              <Skeleton.Button
                style={{ height: "17rem" }}
                className="mt-2"
                block
                active
                size="large"
              />
            }
          </div>
        </div>
      </div>
    );
  } else {
    if (props.organisations.length > 0) {
      return (
        <>
          <div className="flex flex-col w-full items-center ">
            {props.contextHolder}
            {props.organisations.map((org, i) => {
              return (
                <OrgListOrg
                  key={i}
                  organisation={org}
                  organisationData={props.organisationData[i]}
                  onClickUsers={() => {
                    props.requestUsers(org.id_org, org.title);
                  }}
                />
              );
            })}
            <div className="h-5" />
          </div>
        </>
      );
    } else
      return (
        <div className="flex flex-col w-full justify-center">
          {props.contextHolder}
          <p className="w-full text-center"> Aucune organisation trouvée. </p>
          <Button type="link" onClick={props.handleCreateOrganisation}>
            {" "}
            Créer une nouvelle organisation{" "}
          </Button>
        </div>
      );
  }
}

export default OrgList;
