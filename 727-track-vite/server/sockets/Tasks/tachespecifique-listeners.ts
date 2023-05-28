import { Socket } from "socket.io";
import { task, user } from "../../../server-client/types.js";
import {
  getGoogleIdFromSocket,
  getUserIDFromSocket,
} from "../../Google/google-profile-helper.js";
import {
  completeTask,
  uncompleteTask,
} from "../../Google/google-tasks-helper.js";
import { getProjectUsers } from "../../utils/DataBase/project-data.js";
import {
  canSeeTask,
  deleteTask,
  getTaskAffectedBy,
  getTaskByID,
  getTaskGoogleID,
  getTaskUsers,
  hasTaskPerms,
  ModifyTask,
  UpdateTaskStatus,
} from "../../utils/DataBase/task-data.js";
import {
  getUserDB,
  getUserDBfromGoogleID,
} from "../../utils/DataBase/user-data.js";
import { isAdminFromSocket } from "../../utils/admin.js";
import { Log } from "../../utils/logging.js";

/**
 * Crée tous les listeners pour la page "Tâche spécifique"
 * @param socket The socket client à écouter
 */
export function runTacheSpecifiqueListeners(socket: Socket) {
  socket.on(
    "Application:TacheSpec:GetTaskById",
    async (target_task_id: number) => {
      // BD REQUEST HERE
      let task: task | null = await getTaskByID(target_task_id);

      const admin = await isAdminFromSocket(socket);
      if (task == null) {
        Log("Cant find task", "ERROR");
        socket.emit("Application:TacheSpec:ReceiveTaskById", null);
        return;
      }
      if (!admin) {
        if (
          !(await canSeeTask(target_task_id, await getUserIDFromSocket(socket)))
        ) {
          Log("Cant see task", "ERROR");
          socket.emit("Application:TacheSpec:ReceiveTaskById", null);
          return;
        }
      }

      const affectedBy = await getTaskAffectedBy(target_task_id);
      const isOwner = await hasTaskPerms(
        await getUserIDFromSocket(socket),
        target_task_id
      );
      let users: (user | null)[] | null = null;
      let collaborators;
      if (task != null) {
        collaborators = await getTaskUsers(task.id_task);
        if (task.projects_id_project == null) {
          users = [
            await getUserDBfromGoogleID(await getGoogleIdFromSocket(socket)),
          ];
        } else {
          users = await getProjectUsers(task.projects_id_project);
        }

        if (collaborators != null) {
          collaborators = collaborators?.map((x) => {
            x.token_google = "";
            x.id_google = "";
            return x;
          });
        }
      }
      socket.emit(
        "Application:TacheSpec:ReceiveTaskById",
        task,
        isOwner,
        users,
        collaborators,
        affectedBy
      );
    }
  );

  socket.on(
    "Application:SpecificTask:ModifyTask",
    async (
      id: number | null,
      title: string,
      limitDate: Date,
      description: string,
      collaborators: user[]
    ) => {
      Log("received change task with time : " + limitDate);
      if (id == null) {
        socket.emit("Application:SpecificTask:Modification:ServerReply", false);
        return;
      }
      const task = await getTaskByID(id);

      if (task == null) {
        socket.emit("Application:SpecificTask:Modification:ServerReply", false);
        return;
      }

      if (!(await hasTaskPerms(await getUserIDFromSocket(socket), id))) {
        socket.emit("Application:SpecificTask:Modification:ServerReply", false);
        return;
      }

      const id_modifier = await getUserIDFromSocket(socket);
      const modifierName = await getUserDB(id_modifier);
      let worked: boolean;
      if (modifierName) {
        worked = await ModifyTask(
          title,
          id,
          description,
          limitDate,
          collaborators,
          task.status,
          modifierName.username
        );
      } else {
        worked = false;
      }

      socket.emit("Application:SpecificTask:Modification:ServerReply", worked);
    }
  );

  socket.on(
    "Application:SpecificTask:StartTask",
    async (task_id: number | null) => {
      if (task_id == null) {
        socket.emit("Application:SpecificTask:Modification:ServerReply", false);
        return;
      }

      if (!(await hasTaskPerms(await getUserIDFromSocket(socket), task_id))) {
        socket.emit("Application:SpecificTask:Modification:ServerReply", false);
        return;
      }

      const worked = await UpdateTaskStatus(task_id, "In Progress");
      socket.emit("Application:SpecificTask:Modification:ServerReply", worked);
    }
  );

  socket.on(
    "Application:SpecificTask:UncompleteTask",
    async (task_id: number | null) => {
      if (task_id == null) {
        socket.emit("Application:SpecificTask:Modification:ServerReply", false);
        return;
      }

      if (!(await hasTaskPerms(await getUserIDFromSocket(socket), task_id))) {
        socket.emit("Application:SpecificTask:Modification:ServerReply", false);
        return;
      }

      const users: user[] | null = await getTaskUsers(task_id);
      if (users != null) {
        for (const user of users) {
          let taskToken: string | null = await getTaskGoogleID(
            user.id_user.toString(),
            task_id
          );
          if (taskToken != null) {
            uncompleteTask(user.token_google, taskToken);
          }
        }
      }
      const worked = await UpdateTaskStatus(task_id, "In Progress");
      socket.emit("Application:SpecificTask:Modification:ServerReply", worked);
    }
  );

  socket.on(
    "Application:SpecificTask:UnstartTask",
    async (task_id: number | null) => {
      if (task_id == null) {
        socket.emit("Application:SpecificTask:Modification:ServerReply", false);
        return;
      }
      const worked = await UpdateTaskStatus(task_id, "Waiting");
      socket.emit("Application:SpecificTask:Modification:ServerReply", worked);
    }
  );

  socket.on(
    "Application:SpecificTask:CompleteTask",
    async (task_id: number | null) => {
      if (task_id == null) {
        socket.emit("Application:SpecificTask:Modification:ServerReply", false);
        return;
      }

      if (!(await hasTaskPerms(await getUserIDFromSocket(socket), task_id))) {
        socket.emit("Application:SpecificTask:Modification:ServerReply", false);
        return;
      }

      const users: user[] | null = await getTaskUsers(task_id);

      if (users != null) {
        for (const user of users) {
          let taskToken: string | null = await getTaskGoogleID(
            user.id_user.toString(),
            task_id
          );
          if (taskToken != null) {
            completeTask(user.token_google, taskToken);
          }
        }
      }
      const worked = await UpdateTaskStatus(task_id, "Completed");
      socket.emit("Application:SpecificTask:Modification:ServerReply", worked);
    }
  );

  socket.on("Application:SpecificTask:DeleteTask", async (task_id) => {
    if (!(await hasTaskPerms(await getUserIDFromSocket(socket), task_id))) {
      socket.emit("Application:SpecificTask:Modification:ServerReply", false);
      return;
    }

    const worked = await deleteTask(task_id);

    socket.emit("Application:SpecificTask:Modification:ServerReply", worked);
  });
}
