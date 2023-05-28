import React from "react";
import { event, task } from "../../../../server-client/types.js";
import { RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { Button } from "antd";
interface taskSummaryProps {
  events: event[];
}
function EventSummary(props: taskSummaryProps) {
  const navigate = useNavigate();

  if(props.events.length == 0) {
    return <div className="h-full w-full flex flex-col justify-center items-center">
      <p className="font-bold text-lg">
        Aucun événement aujourd'hui 
      </p>
      <Button type="link" onClick={() => navigate("/createevent")}>
        {" "}
        Créer un nouvel événement{" "}
      </Button>

    </div>
  }
  else return (
    <div className={`overflow-auto`}>
      {props.events.map((x, i) => {
        return (
          <div
            key={`${i}`}
            onClick={() => navigate(`/event/${x.id_event}`)}
            className="items-center justify-between h-[4rem] mx-4 flex rounded-xl 
              hover:bg-gray-100 transition-all duration-300 cursor-pointer
              bg-white mt-2"
          >
            <div className="ml-2 overflow-hidden text-ellipsis whitespace-nowrap w-96 lg:w-[32vw] md:w-[24vw] ">
              {x.title}
            </div>
            <div className="h-2 flex justify-end text-2xl mx-2">
              <RightOutlined />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default EventSummary;
