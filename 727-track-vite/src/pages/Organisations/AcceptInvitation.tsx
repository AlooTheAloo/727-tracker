import { Avatar, Button, Spin, Tag, notification } from "antd";
import React, { useEffect, useRef, useState } from "react";
import "../../css/invite.css";
import { socket } from "../../App.js";
import { inviteState, organisation } from "../../../server-client/types.js";
import { useNavigate, useParams } from "react-router-dom";
import AcceptInvitationBody from "../../Components/organisations/AcceptInvitation/AcceptInvitationBody.js";
import { StoreNotification, generateNotification } from "../../utils/index.js";
import { notificationData } from "../../utils/frontend-types.js";

enum PageStates {
  Loading,
  InvalidInvitation,
  AlreadyInOrganisation,
  ShowInvitation,
}

function AcceptInvitation() {
  const [state, setPageState] = useState(PageStates.Loading);
  const [image, setImage] = useState("");
  const [userCount, setUserCount] = useState(-1);
  const [api, contextHolder] = notification.useNotification();

  const organisationRef = useRef<organisation>();

  const navigate = useNavigate();

  const { link } = useParams();

  const enableListeners = () => {
    socket.on(
      "Application:InviteToOrganisation:ReceiveInviteInfo",
      (
        inviteState: inviteState,
        organisation: organisation,
        image: string,
        userCount: number
      ) => {
        console.log(`${inviteState} ${organisation} ${image}`);
        switch (
          inviteState // Set respective page state
        ) {
          case "InvalidLink":
            console.log("Invalid link");
            setPageState(PageStates.InvalidInvitation);
            break;
          case "ValidLink":
          case "AlreadyInOrganisation":
            organisationRef.current = organisation;
            setImage(image);
            setPageState(
              inviteState == "AlreadyInOrganisation"
                ? PageStates.AlreadyInOrganisation
                : PageStates.ShowInvitation
            );
            setUserCount(userCount);
            break;
        }
      }
    );

    socket.on(
      "Application:InviteToOrganisation:AcceptInvitationReply",
      (worked: boolean) => {
        if (worked) {
          StoreNotification(
            {
              title: "Organisation rejointe",
              description: `Vous avez rejoint "${organisationRef.current?.title}" `,
              status: "info",
            },
            () => {
              navigate("/organisations");
            }
          );
        } else {
          generateNotification(api, {
            title: "Erreur interne",
            description: `Impossible de rejoindre ${organisationRef.current?.title}`,
            status: "error",
          });
        }
      }
    );
  };

  const acceptInvitation = () => {
    socket.emit("Application:InviteToOrganisation:AcceptInvitation", link);
  };

  const declineInvitation = () => {
    navigate("/");
  };

  useEffect(() => {
    socket.emit("Application:InviteToOrganisation:GetInviteInfo", link);
    enableListeners();
  }, []);

  return (
    <>
      {contextHolder}
      {/* Main area */}
      <div className="h-full min-h-[95vh]  absolute w-full flex justify-center items-center z-10">
        <div
          className={`sm:w-[40rem] h-[42rem] max-h-[90vh] min-h-[30rem] w-full mx-5 bg-white rounded-md ${
            state == PageStates.Loading
              ? "flex justify-center items-center"
              : ""
          }`}
        >
          <AcceptInvitationBody
            state={state}
            image={image}
            organisation={organisationRef.current}
            userCount={userCount}
            acceptInvitation={acceptInvitation}
            declineInvitation={declineInvitation}
          />
        </div>
      </div>

      {/* BG Animation */}
      <div className="area">
        <ul className="circles">
          {Array.apply(null, Array(10)).map((x, i) => {
            return <li key={i}></li>;
          })}
        </ul>
      </div>
    </>
  );
}

export default AcceptInvitation;
