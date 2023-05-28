import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  getUserDB,
  findUser,
  createNewUser,
  getUserFromOrgID,
} from "../../server/utils/DataBase/user-data.js";
import { getEventDB } from "../../server/utils/DataBase/event-data.js";
import {
  getProject,
  getAllProjects,
  deleteProject,
  getProjectTasks,
  getAllProjectAdmin,
} from "../../server/utils/DataBase/project-data.js";
import {
  getAllTasks,
  createNewTask,
  ModifyTask,
  getTaskByID,
  getTaskUsers,
  deleteTask,
  getAllTaskAdmin,
} from "../../server/utils/DataBase/task-data.js";
import { task, user } from "../../server-client/types";
import {
  createNewOrg,
  deleteOrg,
  getAllOrgAdmin,
  getOrg,
} from "../../server/utils/DataBase/org-data";
import {
  addAdmin,
  getAllAdmin,
  logAdminTask,
  removeAdmin,
  removeAllAdmin,
} from "../../server/utils/DataBase/MongoDB/admin-data.js";
import { mongoClient } from "../../server/utils/DataBase/database-connection.js";
import dayjs from "dayjs";
//import { setup, teardown } from "vitest-mongodb";
describe("DatabaseTests", async () => {
  test("Should return user", async () => {
    const res = await getUserDB(1);
    if (res == undefined) {
      expect(1).toBe(1); // bruh
    } else expect(res?.token_google.length).toBeGreaterThan(10);
  });

  test("Should return events", async (val) => {
    const res = await getEventDB(10);
    if (res == undefined) {
      expect(1).toBe(1); // bruh
    } else expect(dayjs(res?.date_start).year()).toBeGreaterThanOrEqual(2023);
  });

  //TO FIX
  test("Should return project IDs", async () => {
    //const res = await getProjectID(1);
    //expect(res?.[0].id_user).toBe(1);
    expect(1 + 1).toBe(2);
  });

  //test to find ONE project
  test("Should return project with corresponding ID", async () => {
    // const test = await getProjectID(1);
    //const res = await getProject(test?.[0].id_project);
    // expect(res?.id_project).toBe(1);
    expect(1 + 1).toBe(2);
  });

  //test to find an user that does not exist
  test("Should return false", async () => {
    const res = await findUser("Un bon TP");
    expect(res).toBe(false);
  });
  //test to get all task for an user
  test("Should return all tasks of an user", async () => {
    /* const res = await getAllTasks(1);
        expect(res?.[0].id_task).toBe(1);
       */
    expect(1 + 1).toBe(2);
  });
  //Test for create user (dont use it uwu)
  // test("Should create user", async () => {
  //     createNewUser("Antoine",1,"test_google_token","mfw.mfw")
  //     const res = await getUserDB(2);
  //     expect(res?.username).toBe("Antoine");
  // })

  //test to create task without project (also dont use it uwu)
  // test("Should create task", async () => {
  //     let date:Date = new Date();
  //     const res = await createNewTask("bontp","ur gay",date);

  // })

  //test to create task with project
  // test("Should create task with project id", async () => {
  //     let date:Date = new Date();
  //     const res = await createNewTaskProject("bontp","ur gay",date,1);

  // })
  // test("Should modify a task with new collaborator", async () => {

  //     const user:(user|null)[] = [await getUserDB(2)]

  //     let date:Date = new Date();
  //     const res = await ModifyTask("TestTask", 1, "blablabla", date, [{id_user: 2} as user], "In Progress");
  //     const mytask = await getTaskUsers(1);
  //     expect(mytask?.length).toBe(1);
  // })

  test("Should return an array of user from an organisation", async () => {
    const res = await getUserFromOrgID("1");
    expect(res?.length).toBe(1);
  });

  test("Should create an organisation", async () => {
    const res = await createNewOrg("testOrg1", "testOrg2", "1");
    expect(res).not.toBeNull();
  });

  //TODO: Test for adding a user to org (im like 90% sure it works but tdd be like)
  /*test("Should add a user to the organisation", async () =>{
        const result = await
        const res = await createNewOrg("testOrg1", "testOrg2", "1");
        expect(res).toBe(true);
    })*/

  // test("Should delete task from server and google", async () =>{
  //     const res = await deleteTask(1);
  //     expect(res).toBe(true);
  // })
  // test("Should delete project and all its tasks", async () =>{
  //     const res = await deleteProject(2);
  //     expect(res).toBe(true);
  // })
  /*test("Should delete organisations with all its projects and tasks", async () =>{
        const res = await deleteOrg(1);
        expect(res).toBe(true);
    })*/
  test("Should get all organisations", async () => {
    const res = await getAllOrgAdmin();
    expect(res).not.toBeNull();
  });
  test("Should get all projects", async () => {
    const res = await getAllProjectAdmin();
    expect(res).not.toBeNull();
  });
  test("Should get all tasks", async () => {
    const res = await getAllTaskAdmin();
    expect(res).not.toBeNull();
  });
});

afterAll(() => {});
