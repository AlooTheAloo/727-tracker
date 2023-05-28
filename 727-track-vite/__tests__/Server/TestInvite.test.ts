import { describe, expect, test } from "vitest";
import {
  createInviteLink,
  linkToOrg,
} from "../../server/utils/DataBase/organisation-invite.js";

describe("InvitationStates", async () => {
  test("Should find the invitation link", async () => {
    const res = await linkToOrg("testlink123");
    expect(res?.id_org).toBe(1);
  });
});
