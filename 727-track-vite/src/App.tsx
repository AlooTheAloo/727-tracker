import React, { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events.js";
import { ConfigProvider } from "antd";
import Home from "./pages/Home.js";
import Login from "./pages/Misc/Login.js";
import Taches from "./pages/Tasks/Taches.js";
import SpecificTask from "./pages/Tasks/SpecificTask.js";
import CreateTache from "./pages/Tasks/CreateTache.js";
import AddProject from "./pages/Projects/AddProject";
import { GlobalContext } from "./Components/Global/context/GlobalContext.js";
import Not_Found from "./pages/Misc/Not_Found.js";
import Organisations from "./pages/Organisations/Organisations.js";
import Projets from "./pages/Projects/Projets.js";
import SpecificProject from "./pages/Projects/SpecificProject.js";
import frFR from "antd/locale/fr_FR";
import CreateOrganisation from "./pages/Organisations/CreateOrganisation.js";
import AcceptInvitation from "./pages/Organisations/AcceptInvitation.js";
import OrganisationSpec from "./pages/Organisations/OrganisationSpec.js";
import EventCalendar from "./pages/Events/Calendar.js";
import CreateEvent from "./pages/Events/CreateEvent.js";
import SpecificEvent from "./pages/Events/SpecificEvent.js";
import Notifications from "./pages/Notifications/notif.js";

export let socket: Socket<DefaultEventsMap, DefaultEventsMap>;
export function App() {
  const [collapsed, setCollapsed] = useState<boolean>(true);

  const [userName, setUserName] = useState<string | undefined>(undefined);

  const [pfp, setPfp] = useState<string | undefined>(undefined);

  if (!socket) socket = io({ reconnection: true, withCredentials: true });

  useEffect(() => {
    socket.on("Application:Redirect", (url: string) => {
      window.location.href = url;
    });
  }, []);

  return (
    <GlobalContext.Provider
      value={{ collapsed, setCollapsed, userName, setUserName, pfp, setPfp }}
    >
      <ConfigProvider locale={frFR}>
        <Routes>
          {/*Projects*/}
          <Route path="/projectlist" element={<Projets />} />
          <Route path="/addproject" element={<AddProject />} />
          <Route path="/project/:id" element={<SpecificProject />} />

          {/*Tasks*/}
          <Route path="/task/:id" element={<SpecificTask />} />
          <Route path="/createtache" element={<CreateTache />} />
          <Route path="/tasklist" element={<Taches />} />

          {/* Organisations */}
          <Route path="/organisations" element={<Organisations />} />
          <Route path="/organisation/:id" element={<OrganisationSpec />} />
          <Route path="/createorganisation" element={<CreateOrganisation />} />
          <Route path="/invite/:link" element={<AcceptInvitation />} />

          {/* Événements */}
          <Route path="/events" element={<EventCalendar />} />
          <Route path="/createevent" element={<CreateEvent />} />
          <Route path="/event/:id" element={<SpecificEvent />} />

          {/* Notification */}
          <Route path="/notifications" element={<Notifications />} />

          {/*Others*/}
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Not_Found />} />
          {/*Just like brodeur's car*/}
        </Routes>
      </ConfigProvider>
    </GlobalContext.Provider>
  );
}
