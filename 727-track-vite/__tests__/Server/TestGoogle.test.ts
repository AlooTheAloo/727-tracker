import { describe, expect, test } from "vitest";
import { task } from "../../server-client/types.js";
import { verifyToken } from "../../server/Google/google-profile-helper.js";
import { addGoogleTask } from "../../server/Google/google-tasks-helper.js";

describe("GoogleTests", async () => {
  test("should not accept incorrect token", () => {
    verifyToken("abcdef12345").then((res) => {
      expect(res).toBe(false);
    });
  });

  test("should not create task for invalid user", async () => {
    const task: task = {
      title: "",
      description: "",
      date_created: new Date(),
      date_todo: new Date(),
      date_modified: new Date(),
      id_task: 1,
      projects_id_project: 1,
      status: "In Progress",
    } as task;
    const res = await addGoogleTask("detah", task);
    expect(res.error).toBe("disconnected");
  });
});
