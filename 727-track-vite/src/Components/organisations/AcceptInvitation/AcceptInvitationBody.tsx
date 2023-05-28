import { Avatar, Button, Spin } from "antd";
import React from "react";
import { organisation } from "../../../../server-client/types.js";

enum PageStates {
  Loading,
  InvalidInvitation,
  AlreadyInOrganisation,
  ShowInvitation,
}
interface AcceptInvitationBodyProps {
  state: PageStates;
  image: string;
  organisation: organisation | undefined;
  userCount: number;
  acceptInvitation: () => void;
  declineInvitation: () => void;
}

function AcceptInvitationBody(props: AcceptInvitationBodyProps) {
  switch (props.state) {
    case PageStates.Loading:
      return <Spin />;
    case PageStates.ShowInvitation:
      return (
        <div className="flex flex-col h-full">
          <div className="w-full h-3/4 flex justify-center items-center flex-col">
            <Avatar
              src={`data:image/gif;base64,${props.image}`}
              className="bg-cover rounded-xl w-36 h-36 "
            />
            <p className={`text-md text-gray-600 mt-4`}>
              Vous avez été invité à rejoindre
            </p>
            <p className={`text-lg font-bold mt-2 `}>
              {props.organisation?.title}
            </p>
            <p className="bg-gray-100 w-fit px-3 py-2 rounded-md mt-3 ">
              {props.userCount} Utilisateur{props.userCount == 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex h-1/4 w-full justify-center items-start gap-2">
            <Button
              type="primary"
              onClick={() => {
                props.acceptInvitation();
              }}
            >
              Accepter l'invitation
            </Button>

            <Button
              onClick={() => {
                props.declineInvitation();
              }}
            >
              Annuler
            </Button>
          </div>
        </div>
      );
    case PageStates.AlreadyInOrganisation:
      return (
        <>
          <div className="w-full h-3/4 flex justify-center items-center flex-col">
            <Avatar
              src={`data:image/gif;base64,${props.image}`}
              className="bg-cover rounded-xl w-36 h-36 "
            />
            <p className={`text-md text-gray-600 mt-4`}>
              Vous faites déjà partie de
            </p>
            <p className={`text-lg font-bold mt-2 `}>
              {props.organisation?.title}
            </p>
          </div>
          <div className="flex h-1/4 w-full justify-center items-start gap-2">
            <Button
              type="primary"
              onClick={() => {
                props.declineInvitation();
              }}
            >
              Retour au menu principal
            </Button>
          </div>
        </>
      );
    case PageStates.InvalidInvitation:
      return (
        <>
          <div className="w-full h-1/2 flex justify-end items-center flex-col">
            <p className={`text-md text-gray-600 mb-2 font-semibold`}>
              Cette invitation est invalide ou expirée :(
            </p>
          </div>
          <div className="flex h-1/2 w-full justify-center items-start gap-2 mt-2">
            <Button
              type="primary"
              onClick={() => {
                props.declineInvitation();
              }}
            >
              Retour au menu principal
            </Button>
          </div>
        </>
      );
  }
}

export default AcceptInvitationBody;
