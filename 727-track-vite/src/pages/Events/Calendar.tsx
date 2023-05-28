import React, { useEffect, useRef, useState } from "react";
import SideBar, { SideBarOptions } from "../../Components/Global/SideBar.js";
import { Badge, BadgeProps, Calendar, Skeleton, notification } from "antd";
import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween.js";
import { event } from "../../../server-client/types.js";
import { socket } from "../../App.js";
import { CalendarMode } from "antd/es/calendar/generateCalendar.js";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import EventItem from "../../Components/Events/EventItem.js";
import { notificationData } from "../../utils/frontend-types.js";
import { generateNotification } from "../../utils/index.js";

function EventCalendar() {
  dayjs.extend(isBetween);

  const [api, contextHolder] = notification.useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<event[]>();
  const [shownEvents, setShownEvents] = useState<event[]>();
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("month");

  const navigate = useNavigate();
  useEffect(() => {
    const NotifData: string | null = localStorage.getItem("showNotification");

    if (NotifData != null) {
      const parsedTaskData: notificationData = JSON.parse(NotifData);
      generateNotification(api, parsedTaskData);
    }

    localStorage.removeItem("showNotification");

    socket.emit("Application:Calendar:GetEvents");
    socket.on("Application:Calendar:ReceiveEvents", (events: event[]) => {
      setEvents(events);
      setIsLoading(false);
      setShownEvents(
        events.filter((x) =>
          dayjs().isBetween(
            dayjs(x.date_start),
            dayjs(x.date_end),
            "date",
            "[]"
          )
        )
      );
    });
  }, []);

  const requestEvents = (day: Dayjs) => {
    if (isLoading || events == null) return;
    setShownEvents(
      events.filter((x) =>
        day.isBetween(
          dayjs(x.date_start),
          dayjs(x.date_end),
          calendarMode == "month" ? "date" : "month",
          "[]"
        )
      )
    );
  };

  const onPanelChange = (value: Dayjs, mode: CalendarMode) => {
    setCalendarMode(mode);
  };

  const CalendarBody = () => {
    if (isLoading) {
      return (
        <>
          {Array.apply(null, Array(4)).map((x, i) => {
            return (
              <div className="mx-5" key={`${i}`}>
                <Skeleton.Button
                  key={`${i}`}
                  block
                  active
                  className="mt-2"
                  style={{ height: "3rem" }}
                />
              </div>
            );
          })}
        </>
      );
    } else {
      if (shownEvents == null || shownEvents?.length == 0) {
        return (
          <div className="w-full h-full flex justify-center items-center font-semibold text-lg">
            Aucun événement pour cette journée
          </div>
        );
      } else {
        return (
          <>
            {shownEvents.map((x, i) => {
              return (
                <div key={i}>
                  <EventItem event={x} />
                </div>
              );
            })}
          </>
        );
      }
    }
  };

  return (
    <>
      {contextHolder}
      <div className="flex w-screen h-screen max-h-screen">
        <SideBar selectedOption={SideBarOptions.Events} />
        <div className="flex-grow flex flex-col h-full items-center min-w-0 ">
          <h1 className="w-11/12 text-4xl my-6 font-semibold text-center">
            Événements
          </h1>
          <div className="w-11/12 flex items-center justify-end  ">
            <div className="bg-gray-900 float-right justify-center align-middle rounded-xl flex">
              <button
                onClick={() => navigate("/createevent")}
                className="w-12 h-12 bg-inherit rounded-xl"
              >
                <PlusOutlined className="invert text-lg" />
              </button>
            </div>
          </div>
          <div className="w-11/12 flex flex-col lg:flex-row items-center justify-between mb-12 flex-grow max-h-[43vh] md:max-h-[100000vw]">
            <div className=" lg:w-2/5 h-full  items-center flex">
              <Calendar
                mode={calendarMode}
                onSelect={requestEvents}
                fullscreen={false}
                onPanelChange={onPanelChange}
              />
            </div>
            <div className="flex w-full lg:w-3/5 h-full justify-center">
              <div
                className={
                  "flex flex-col bg-[#E9E9E9]  border-[#707070] border-2 w-full lg:ml-12 rounded-lg overflow-x-hidden pb-3 " +
                  "my-4  transition-all overflow-y-scroll"
                }
              >
                <CalendarBody />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default EventCalendar;
