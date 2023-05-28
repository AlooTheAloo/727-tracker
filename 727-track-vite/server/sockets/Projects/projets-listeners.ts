import { Socket } from "socket.io";
import {
  project,
  status,
  user,
  organisation,
} from "../../../server-client/types.js";
import {
  getGoogleIdFromSocket,
  getUserIDFromSocket,
} from "../../Google/google-profile-helper.js";
import {
  getOrgsFromUser,
  getOrg,
  getUsersFromOrg,
  getAllOrgAdmin,
} from "../../utils/DataBase/org-data.js";
import {
  addProject,
  canSeeProject,
  deleteProject,
  getAllProjectAdmin,
  getAllProjects,
  getProject,
  getProjectAffectedBy,
  getProjectUsers,
  getTaskNum,
  hasProjectPerms,
  ModifyProject,
  UpdateProjectStatus,
} from "../../utils/DataBase/project-data.js";
import {
  getTaskAffectedBy,
  hasTaskPerms,
} from "../../utils/DataBase/task-data.js";
import {
  getUserDB,
  getUserDBfromGoogleID,
} from "../../utils/DataBase/user-data.js";
import { Log } from "../../utils/logging.js";
import { isAdminFromSocket } from "../../utils/admin.js";

export function runProjetsListeners(socket: Socket) {
  socket.on("Application:Projets:GetProjects", async () => {
    const id = getGoogleIdFromSocket(socket);
    const admin = await isAdminFromSocket(socket);
    let projects: project[] | null;
    if (admin) {
      projects = await getAllProjectAdmin();
    } else {
      projects = await getAllProjects(id);
    }

    if (projects == null) {
      socket.emit("Application:Projets:ReceiveProjects", null);
      return;
    }

    // We can assume projects != null
    for (let i = 0; i < projects.length; i++) {
      const taskNum = await getTaskNum(
        await getUserIDFromSocket(socket),
        projects[i].id_project
      );
      if (taskNum == null) continue;
      projects[i].taskCompleted = taskNum.completed;
      projects[i].taskTotal = taskNum.total;
    }
    socket.emit("Application:Projets:ReceiveProjects", projects);
  });

  socket.on("Application:Projects:GetOrganisations", async () => {
    const userID = await getUserIDFromSocket(socket);
    const admin = await isAdminFromSocket(socket);
    let orgs;
    if (admin) {
      orgs = await getAllOrgAdmin();
    } else {
      orgs = userID == "" ? [] : await getOrgsFromUser(userID);
    }

    socket.emit("Application:Projects:ReceiveOrganisations", orgs);
  });

  socket.on("Application:CreateTache:GetProjects", async () => {
    const id = getGoogleIdFromSocket(socket);
    const projects: project[] | null = await getAllProjects(id);
    socket.emit("Application:CreateTache:ReceiveProjects", projects);
  });
  // socket.emit("Application:CreateProject:Getorganisations");
  socket.on("Application:CreateProject:Getorganisations", async () => {
    const userID = await getUserIDFromSocket(socket);
    const orgs = userID == "" ? [] : await getOrgsFromUser(userID);
    socket.emit("Application:CreateProject:Receiveorganisations", orgs);
  });

  socket.on(
    "Application:CreateProject:CreateProject",
    async (project: project, collaborators: user[]) => {
      project.user_creator_id = await getUserIDFromSocket(socket);
      const projectCreated = await addProject(project, collaborators);

      socket.emit(
        "Application:CreateProject:CreatedProject",
        projectCreated,
        project.title
      );
    }
  );

  socket.on(
    "Application:ProjectSpec:GetProjectByID",
    async (projectID: number) => {
      const project = await getProject(projectID);
      const admin = await isAdminFromSocket(socket);
      if (project == null) {
        socket.emit("Application:ProjectSpec:ReceiveProjectByID", null);
        return;
      }
      if (!admin) {
        if (
          !(await canSeeProject(projectID, await getUserIDFromSocket(socket)))
        ) {
          socket.emit("Application:ProjectSpec:ReceiveProjectByID", null);
          return;
        }
      }

      const affectedBy = await getProjectAffectedBy(projectID);
      const isOwner = await hasProjectPerms(
        await getUserIDFromSocket(socket),
        projectID
      );

      let users: (user | null)[] | null;
      if (project.organisations_id_org == null) {
        users = [
          await getUserDBfromGoogleID(await getGoogleIdFromSocket(socket)),
        ];
      } else {
        users = await getUsersFromOrg(project.organisations_id_org);
      }

      let collaborators = await getProjectUsers(project.id_project);
      if (collaborators != null) {
        collaborators = collaborators?.map((x) => {
          x.token_google = "";
          x.id_google = "";
          return x;
        });
      }
      socket.emit(
        "Application:ProjectSpec:ReceiveProjectByID",
        project,
        isOwner,
        users,
        collaborators,
        affectedBy
      );
    }
  );

  socket.on(
    "Application:Project:ModifyProject",
    async (
      id_project: number,
      title: string,
      date_todo: Date,
      description: string,
      collaborators: user[]
    ) => {
      if (id_project == null) return;
      const project = await getProject(id_project);
      if (project == null) return;

      if (
        !(await hasProjectPerms(await getUserIDFromSocket(socket), id_project))
      )
        return;

      const id_modifier = await getUserIDFromSocket(socket);
      const modifier_user = await getUserDB(id_modifier);

      let worked: boolean;
      if (modifier_user) {
        worked = await ModifyProject(
          title,
          id_project,
          description,
          date_todo,
          collaborators,
          project.status,
          modifier_user.username
        );
      } else {
        worked = false;
      }
      socket.emit("Application:Project:Modification:ServerReply", worked);
    }
  );

  socket.on(
    "Application:Project:SetProjectStatus",
    async (project_id: number, status: status) => {
      // Broken web request
      if (project_id == null) {
        socket.emit("Application:Project:Modification:ServerReply", false);
        return;
      }

      // Security
      if (
        !(await hasProjectPerms(await getUserIDFromSocket(socket), project_id))
      ) {
        socket.emit("Application:Project:Modification:ServerReply", false);
        return;
      }

      //Broken web request & security
      if (!["Waiting", "In Progress", "Completed"].includes(status)) {
        socket.emit("Application:Project:Modification:ServerReply", false);
        return;
      }

      const worked = await UpdateProjectStatus(project_id, status);
      socket.emit("Application:Project:Modification:ServerReply", worked);
    }
  );
  socket.on("Application:Project:DeleteProject", async (project_id) => {
    if (
      !(await hasProjectPerms(await getUserIDFromSocket(socket), project_id))
    ) {
      socket.emit("Application:Project:Modification:ServerReply", false);
      return;
    }

    const worked = await deleteProject(project_id);

    socket.emit("Application:Project:Modification:ServerReply", worked);
  });
}
