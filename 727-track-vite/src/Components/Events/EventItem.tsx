import React from "react";
import { event } from "../../../server-client/types.js";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

interface EventItemProps {
  event: event;
}

function EventItem(props: EventItemProps) {
  const navigate = useNavigate();
  const dateDisplay = () => {
    return `${dayjs(props.event.date_start).format("MM/DD HH:mm")} →
    ${dayjs(props.event.date_end).format("MM/DD HH:mm")}`;
  };

  return (
    <div
      className="flex md:justify-between md:flex-row md:h-14 h-20  flex-col  mt-3 mx-5 bg-white w-[100% - 1.25rem] rounded-lg justify-around hover:bg-gray-200 transition-all duration-150 cursor-pointer"
      onClick={() => {
        navigate(`/event/${props.event.id_event}`);
      }}
    >
      <div className="md:leading-[3.5rem] md:overflow-hidden md:text-ellipsis md:text-left md:whitespace-nowrap text-center break-all items-center md:mx-2 md:flex-grow">
        {props.event.title}
      </div>
      <hr className={`border-1`}></hr>
      <div className="w-full md:w-fit flex font-semibold items-center justify-center md:mr-5 whitespace-nowrap">
        {dateDisplay()}
      </div>
    </div>
  );
}

export default EventItem;
