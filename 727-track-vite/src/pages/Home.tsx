import { Badge, Progress, Steps } from "antd";
import Cookies from "js-cookie";
import React, { useEffect, useState } from "react";
import { socket } from "../App.js";
import SideBar, { SideBarOptions } from "../Components/Global/SideBar.js";
import { BellOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { event, task } from "../../server-client/types.js";
import TaskSummary from "../Components/Home/summaries/TaskSummary.js";
import dayjs from "dayjs";
import EventSummary from "../Components/Home/summaries/EventSummary.js";
import isBetween from "dayjs/plugin/isBetween.js";

function Home() {
  dayjs.extend(isBetween);

  const [tasks, setTasks] = useState<task[]>([]);
  const [events, setEvents] = useState<event[]>([]);

  const [userName, setUserName] = useState<string>();

  useEffect(() => {
    socket.emit("Application:Calendar:GetEvents");
    socket.on("Application:Calendar:ReceiveEvents", (events: event[]) => {
      setEvents(
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

    socket.emit("Application:Taches:GetTasks");
    socket.on("Application:Taches:ReceiveTasks", (tasks: task[]) => {
      console.log(tasks);
      setTasks(tasks);
    });

    setUserName(Cookies.get("UserName"));
  }, []);
  const navigate = useNavigate();
  return (
    <div className="flex h-[90vh]">
      <SideBar selectedOption={SideBarOptions.Home} />
      <div className="flex flex-col w-full h-full m-10 min-h-[40rem]">
        <div className="flex ">
          <div className="flex-grow w-1/2">
            <p className="ml-4 text-3xl whitespace-nowrap text-ellipsis overflow-hidden">
              {" "}
              Bon{new Date().getHours() >= 18 ? "soir" : "jour"}, {userName}
            </p>
          </div>
          <div className="flex-grow w-1/2 flex justify-end items-center">
            <Badge count={0} size="small" offset={["-20", 1]}>
              <BellOutlined
                className="text-3xl mr-4"
                onClick={() => navigate("/notifications")}
              />
            </Badge>
          </div>
        </div>
        <div className="flex flex-grow md:flex-row flex-col ">
          <div className="flex flex-grow md:w-1/2 h-1/2 md:h-auto">
            <div className="flex flex-col m-4 bg-[#E9E9E9] border-[#707070] border-2 w-full h-[calc(100% - 0.5rem)] rounded-lg">
              <div className="md:h-1/6 h-1/3 w-full flex ">
                <div className="flex justify-center items-center w-16 h-16 bg-[#8fa6f3] m-4 rounded-xl">
                  <p className="text-white text-xl font-bold">
                    {events.length}
                  </p>
                </div>
                <div className="mt-4 h-16 flex flex-col justify-center">
                  <p className="space-x-5 font-bold text-xl tracking-wide">
                    Evénement{events.length == 1 ? "" : "s"}
                  </p>
                  <p className="text-gray-400">Aujourd'hui</p>
                </div>
              </div>
              <div className="flex flex-col md:h-[65vh] md:min-h-[29rem] ">
                <EventSummary events={events}></EventSummary>
              </div>
            </div>
          </div>
          <div className="flex flex-grow md:w-1/2 h-1/2 md:h-auto">
            <div className="flex flex-col m-4 bg-[#E9E9E9] border-[#707070] border-2 w-full h-[calc(100% - 0.5rem)] rounded-lg">
              <div className="md:h-1/6 h-1/3 w-full flex ">
                <div className="flex justify-center items-center w-16 h-16 m-4 rounded-xl bg-[#1145f8]">
                  <p className="text-white text-xl font-bold">{tasks.length}</p>
                </div>
                <div className="mt-4 h-16 flex flex-col justify-center">
                  <p className="space-x-5 font-bold text-xl tracking-wide">
                    Tâche{tasks.length == 1 ? "" : "s"}
                  </p>
                  <p className="text-gray-400">Affectés à vous</p>
                </div>
              </div>
              <div className="flex flex-col md:h-[65vh] md:min-h-[29rem] ">
                <TaskSummary tasks={tasks}></TaskSummary>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Home;
