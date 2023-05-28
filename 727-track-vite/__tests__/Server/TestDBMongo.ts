// import {describe, expect, test} from 'vitest';
// import { getUserDB,findUser,createNewUser, getUserFromOrgID} from '../../server/utils/DataBase/user-data.js';
// import { getEventDB} from '../../server/utils/DataBase/event-data.js';
// import { getProject,getAllProjects} from '../../server/utils/DataBase/project-data.js';
// import { getAllTasks,createNewTask, ModifyTask, getTaskByID, getTaskUsers} from '../../server/utils/DataBase/task-data.js';
// import { task, user, project, organisation, notification } from '../../server-client/types';
// import {addAdmin, getAllAdmin, logAdminProject, logAdminTask, removeAdmin, removeAllAdmin, resetAdmin, logAdminOrg} from '../../server/utils/DataBase/MongoDB/admin-data.js';
// import { addNotification, createCounter, deleteNotification, getAndModifySequence, getUserNotification } from '../../server/utils/DataBase/MongoDB/notification-data.js';
// import { notificationData } from '../../src/utils/frontend-types.js';
// describe("DatabaseTests", async () => {
//     test("Should return all admins", async () =>{
//         const res = await getAllAdmin();
//         expect(res[0].id_user).toBe("-1")
//         return;
//     })

//     test("Should add an admin", async () => {
//         await removeAdmin("-1");
//         await addAdmin("-1");
//         await addAdmin("1");
//         const res = await getAllAdmin();
//         expect(res[0].id_user).toBe("-1")
//     })

//     test("Should modify a user by adding a task to its logs", async () =>{
//         await resetAdmin("-1");
//         const t:task = {
//             id_task: -1,
//             title:"A TASK",
//             description:"THAT IS A TASK",
//             date_created: new Date,
//             date_modified:new Date,
//             date_started:undefined,
//             date_todo:undefined,
//             date_end:undefined,
//             status:"Waiting",
//             user_creator_id:-1,
//             projects_id_project:undefined
//           }
//         await logAdminTask("-1", t)
//         const res = await getAllAdmin();
//         expect(res[0].tasks[0].id_task).toBe(-1);
//         await resetAdmin("-1");
//     })

//     test("Should modify a user by adding a project to its logs", async () =>{
//         await resetAdmin("-1");
//         const p:project = {
//             id_project:-1,
//             title:"MONSIEUR PROJET",
//             description:"PROJET",
//             date_created:new Date,
//             date_started:new Date,
//             date_modified:new Date,
//             date_todo:new Date,
//             date_end:new Date,
//             status:"Waiting",
//             organisations_id_org:-1,
//             user_creator_id:"-1",
//             taskCompleted:0,
//             taskTotal:0
//           }
//         await logAdminProject("-1", p)
//         const res = await getAllAdmin();
//         expect(res[0].projects[0].id_project).toBe(-1);
//         await resetAdmin("-1");
//     })

//     test("Should modify a user by adding a organisation to its logs", async () =>{
//         await resetAdmin("-1");
//         const o:organisation = {
//             id_org:-1,
//             title:"MONSIEUR ORGANISATION",
//             description:"ORGANISATION",
//           }
//         await logAdminOrg("-1", o)
//         const res = await getAllAdmin();
//         expect(res[0].organisations[0].id_org).toBe(-1);
//         await resetAdmin("-1");
//     })
//     test("Should create a notification in mongoDB", async () =>{
//         const res = await addNotification("notif1","0");

//         expect(res).toBe(true);
//     })
//     test("Should get notifications of an user", async ()=>{
//         console.log(await getUserNotification("0"));
//     })
//     test("should delete a notification", async ()=>{
//         const res = await deleteNotification("4");
//         expect(res).toBe(true);
//     })
// })
