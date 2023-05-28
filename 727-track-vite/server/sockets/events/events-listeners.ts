import { Socket } from "socket.io";
import { event, user } from "../../../server-client/types.js";
import { getUserIDFromSocket } from "../../Google/google-profile-helper.js";
import {
  DeleteEvent,
  ModifyEvent,
  addEventDB,
  canseeEvent as canSeeEvent,
  getAllLinkedUsers,
  getEventDB,
  getEventsForUser,
  getUsersEvent,
  hasEventPerms,
} from "../../utils/DataBase/event-data.js";
import { Log } from "../../utils/logging.js";
import {
  getProject,
  getProjectUsers,
} from "../../utils/DataBase/project-data.js";

export function runEventsListeners(socket: Socket) {
  socket.on("Application:Calendar:GetEvents", async () => {
    const events = await getEventsForUser(await getUserIDFromSocket(socket));
    socket.emit("Application:Calendar:ReceiveEvents", events ?? []);
  });

  socket.on("Application:CreateEvent:Request:AllLinkedUsers", async () => {
    Log("Finding linked users..");
    const id = await getUserIDFromSocket(socket);
    let users = await getAllLinkedUsers(id);
    users =
      users?.map((x) => {
        return {
          username: x.username,
          profile_picture: x.profile_picture,
          id_user: x.id_user,
        } as user;
      }) ?? null;
    socket.emit("Application:CreateEvent:Receive:Users", users);
  });

  socket.on("Application:SpecificEvent:DeleteEvent", async (id_event) => {
    const user_id = await getUserIDFromSocket(socket);
    const hasPerms = await hasEventPerms(id_event, user_id);

    Log("Has perms : " + hasPerms, "DEBUG");

    if (id_event == undefined || !(hasPerms ?? false)) {
      socket.emit("Application:SpecificEvent:DeleteEvent:ServerReply", false);
      return;
    }
    const res = await DeleteEvent(id_event);
    socket.emit("Application:SpecificEvent:DeleteEvent:ServerReply", res);
  });

  socket.on(
    "Application:ModifyEvent:ModifyEvent",
    async (
      id_event: number,
      collaborators: user[],
      startDate: string,
      endDate: string
    ) => {
      const user_id = await getUserIDFromSocket(socket);
      if (
        id_event == undefined ||
        !(
          (await (hasEventPerms(id_event, user_id) ?? false)) ||
          collaborators.length == 0 ||
          startDate == null ||
          endDate == null
        )
      ) {
        socket.emit(
          "Application:SpecificEvent:Modification:ServerReply",
          false
        );
        return;
      }

      const res = await ModifyEvent(id_event, collaborators, startDate, endDate); // collaborators are mapped, but that shouldnt be an issue
      socket.emit("Application:SpecificEvent:Modification:ServerReply", res);
    }
  );

  socket.on(
    "Application:CreateEvent:Request:ProjectUsers",
    async (project_ID: number) => {
      getProjectUsers(project_ID).then((res) => {
        if (res == null) res = [];
        res = res.map((x) => {
          x.id_google = "";
          x.token_google = "";
          return x;
        });
        socket.emit("Application:CreateEvent:Receive:Users", res);
      });
    }
  );

  socket.on(
    "Application:CreateEvent:CreateEvent",
    async (
      title: string,
      start_date: string,
      end_date: string,
      collaborators: user[],
      projectID: number
    ) => {
      if (
        title == null ||
        title.length < 1 ||
        title.length > 100 ||
        start_date == null ||
        end_date == null ||
        collaborators == null ||
        collaborators.length == 0
      ) {
        socket.emit("Application:CreateEvent:ServerRes", false);
        return;
      }
      const worked = await addEventDB(
        title,
        projectID ?? -1,
        collaborators,
        start_date,
        end_date
      );
      socket.emit("Application:CreateEvent:ServerRes", worked);
    }
  );

  socket.on("Application:EventSpec:GetEventByID", async (evt_id: number) => {
    const userID = await getUserIDFromSocket(socket);
    if (!(await canSeeEvent(userID, evt_id))) {
      socket.emit("Application:EventSpec:ReceiveEventById", null);
      return;
    } else {
      const evt = await getEventDB(evt_id);

      let users: user[];
      let title = "";

      if (
        evt?.projects_id_project == undefined ||
        evt?.projects_id_project == -1 ||
        evt?.projects_id_project == null
      ) {
        // No project
        users = (await getAllLinkedUsers(userID)) ?? [];
      } else {
        // There is project
        users = (await getProjectUsers(evt.projects_id_project)) ?? [];
        const project = await getProject(evt.projects_id_project);
        title = project?.title ?? "";
      }


      users =
        users?.map((x) => {
          return {
            username: x.username,
            profile_picture: x.profile_picture,
            id_user: x.id_user,
          } as user;
        }) ?? null;


      const collaborators = await getUsersEvent(evt_id);
      socket.emit(
        "Application:EventSpec:ReceiveEventById",
        evt,
        users,
        collaborators,
        title
      );
    }

  });
}
