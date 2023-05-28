import { Socket } from "socket.io";
import {
  inviteState,
  organisation,
  organisationUserData,
  user,
} from "../../../server-client/types.js";
import { getUserIDFromSocket } from "../../Google/google-profile-helper.js";
import {
  createNewOrg,
  getOrgsFromUser,
  getUsersFromOrg,
  getUserOrgProjectCount,
  hasOrgPerms,
  orgExists,
  addUserToOrg,
  removeUserFromOrganisation,
  deleteOrg,
  getOrg,
  getAllOrgAdmin,
  isUserInOrg,
  ModifyOrganisation,
  getUserEventsOrgCount,
} from "../../utils/DataBase/org-data.js";
import { getUserDB, getUserFromOrgID } from "../../utils/DataBase/user-data.js";
import { fromRoot, getOrgImagesPath } from "../../utils/utils.js";
import { writeFileSync } from "fs";
import { getProject } from "../../utils/DataBase/project-data.js";
import { BYTES_IN_MB, IMAGE_MAX_MB } from "../../../server-client/constants.js";
import fs from "fs";
import {
  acceptOrgInvitation,
  createInviteLink,
  linkToOrg,
} from "../../utils/DataBase/organisation-invite.js";
import dayjs from "dayjs";
import { Log } from "../../utils/logging.js";
import { isAdminFromSocket } from "../../utils/admin.js";
import { addNotification } from "../../utils/DataBase/MongoDB/notification-data.js";

export function runOrganisationListeners(socket: Socket) {
  socket.on("Application:Organisations:GetOrganisations", async () => {
    const userID = await getUserIDFromSocket(socket);
    let orgs:organisation[] | null;
    const admin = await isAdminFromSocket(socket);
    if (admin) {
      orgs = await getAllOrgAdmin();
    } else {
      orgs = userID == "" ? [] : await getOrgsFromUser(userID);
    }
    const orgData: organisationUserData[] = [];
    if (orgs != null) {
      for (const org of orgs) {
        const path = getOrgImagesPath(org.id_org);
        orgData.push({
          projects: (await getUserOrgProjectCount(userID, org.id_org)) ?? 0,
          events: (await getUserEventsOrgCount(userID, org.id_org)) ?? 0,
          userCount: ((await getUsersFromOrg(org.id_org)) ?? []).length,
          image: fs.existsSync(path)
            ? fs.readFileSync(path).toString("base64")
            : "",
          isOwner: (await hasOrgPerms(org.id_org, userID)) ?? false,
        });
      }
    }

    socket.emit(
      "Application:Organisations:ReceiveOrganisations",
      orgs,
      orgData
    );
  });

  socket.on("Application:CreateProject:GetColl", async (org_ID: number) => {
    if (org_ID == -1) {
      getUserDB(await getUserIDFromSocket(socket)).then((user) => {
        let res = user == null ? [] : [user];
        res = res.map((x) => {
          x.id_google = "";
          x.token_google = "";
          return x;
        });
        socket.emit("Application:CreateProject:ReceiveColl", res);
      });
    } else {
      getUserFromOrgID(org_ID.toString()).then((res) => {
        if (res == null) res = [];
        res = res.map((x) => {
          x.id_google = "";
          x.token_google = "";
          return x;
        });
        socket.emit("Application:CreateProject:ReceiveColl", res);
      });
    }
  });

  socket.on(
    "Application:CreateOrganisation:RequestOrganisationExists",
    async (orgName: string | undefined) => {
      orgName = (orgName ?? "").trim();
      let exists = await orgExists(orgName);
      socket.emit(
        "Application:CreateOrganisation:ReceiveOrganisationExists",
        orgName,
        exists
      );
    }
  );

  socket.on(
    "Application:CreateOrganisation:CreateOrganisation",
    async (title: string, description: string, image: Buffer | undefined) => {
      if (image == null || undefined) {
        socket.emit("Application:CreateOrganisation:ServerReply", false);
        return;
      }
      if (image.length > IMAGE_MAX_MB * BYTES_IN_MB) {
        socket.emit("Application:CreateOrganisation:ServerReply", false);
        return;
      }
      if (title.length > 100 || title == undefined || title.length == 0) {
        socket.emit("Application:CreateOrganisation:ServerReply", false);
        return;
      }
      if (description.length > 1000) {
        socket.emit("Application:CreateOrganisation:ServerReply", false);
        return;
      }
      const newID = await createNewOrg(
        title,
        description,
        await getUserIDFromSocket(socket)
      );

      if (newID.length == 0) {
        socket.emit("Application:CreateOrganisation:ServerReply", false);
        return;
      }
      writeFileSync(getOrgImagesPath(newID), image);
      socket.emit("Application:CreateOrganisation:ServerReply", true);
      Log(`Created organisation '${title}'`, "SUCCESS");
    }
  );

  socket.on("Application:Organisations:GetUsers", async (id_org: number) => {
    const users: user[] | null = await getUsersFromOrg(id_org);
    const usersRights: (boolean | null)[] = [];
    users?.map(async (x) => {
      let ret: user = {
        id_user: x.id_user,
        profile_picture: x.profile_picture,
        username: x.username,
      } as user;
      usersRights.push(await hasOrgPerms(id_org, x.id_user + ""));
      return ret;
    });
    socket.emit(
      "Application:Organisations:ReceiveUsers",
      users,
      await hasOrgPerms(id_org, await getUserIDFromSocket(socket)),
      id_org,
      usersRights
    );
  });

  socket.on(
    "Application:Organisations:CreateInviteLink",
    async (
      id_org: number,
      times: number,
      minutes: number,
      perms: boolean,
      request_id: number
    ) => {
      if (await hasOrgPerms(id_org, await getUserIDFromSocket(socket))) {
        const link = await createInviteLink(
          id_org,
          minutes == -1
            ? -1
            : dayjs().add(minutes, "minutes").toISOString(),
          times,
          perms
        );

        if (link == null) {
          socket.emit(
            "Application:Organisations:CreateInviteLinkStatus",
            false,
            undefined,
            request_id
          );
        } else {
          socket.emit(
            "Application:Organisations:CreateInviteLinkStatus",
            true,
            link,
            request_id
          );
        }
      } else {
        socket.emit(
          "Application:Organisations:CreateInviteLinkStatus",
          false,
          undefined,
          request_id
        );
      }
    }
  );

  socket.on(
    "Application:InviteToOrganisation:GetInviteInfo",
    async (link: string) => {
      const org = await linkToOrg(link);
      let inviteState: inviteState | null = null;

      if (org == null) {
        inviteState = "InvalidLink";
        socket.emit(
          "Application:InviteToOrganisation:ReceiveInviteInfo",
          inviteState
        );
      } else {
        inviteState = "ValidLink";
        const users = (await getUsersFromOrg(org.id_org)) ?? [];
        const userID = await getUserIDFromSocket(socket);
        const len = users
          .map((x) => x.id_user)
          .filter((x) => x + "" == userID).length; // Find users that are also the user that was invited
        if (len != 0) {
          // If user is already in org
          inviteState = "AlreadyInOrganisation"; // State is already in org
        }
        const path = getOrgImagesPath(org.id_org);
        const count = users.length;

        socket.emit(
          "Application:InviteToOrganisation:ReceiveInviteInfo",
          inviteState,
          org,
          fs.existsSync(path) ? fs.readFileSync(path).toString("base64") : "",
          count
        );
      }
    }
  );

  socket.on(
    "Application:InviteToOrganisation:AcceptInvitation",
    async (link) => {
      const org = await linkToOrg(link);
      if (org == undefined) {
        socket.emit(
          "Application:InviteToOrganisation:AcceptInvitationReply",
          false
        );
        return;
      }

      const res = await acceptOrgInvitation(
        link,
        await getUserIDFromSocket(socket)
      );
      socket.emit(
        "Application:InviteToOrganisation:AcceptInvitationReply",
        res ?? false
      );
    }
  );

  socket.on("Application:Organisations:LeaveOrganisation", async (org_id) => {
    const res = removeUserFromOrganisation(
      await getUserIDFromSocket(socket),
      org_id
    );
    socket.emit("Application:Organisations:LeaveOrganisationRes", res);
  });

  socket.on("Application:Organisations:DeleteOrganisation", async (org_id) => {
    const hasPerms = await hasOrgPerms(
      org_id,
      await getUserIDFromSocket(socket)
    );
    if (hasPerms) {
      const res = await deleteOrg(org_id);
      if (res) {
        socket.emit("Application:Organisations:DeleteOrganisationRes", true);
      } else {
        socket.emit("Application:Organisations:DeleteOrganisationRes", false);
      }
    } else {
      socket.emit("Application:Organisations:DeleteOrganisationRes", false);
    }
  });

  socket.on(
    "Application:Organisations:KickUserFromOrg",
    async (user_id: string, org_id: number) => {
      const user_req_id = await getUserIDFromSocket(socket);
      if (!(await hasOrgPerms(org_id, user_req_id))) {
        Log("doesnt have org perms", "ERROR");
        socket.emit("Application:Organisations:KickUserFromOrgRes", false);
        return;
      }
      if (await hasOrgPerms(org_id, user_id)) {
        Log("Other guy *does* have org perms", "ERROR");
        socket.emit("Application:Organisations:KickUserFromOrgRes", false);
        return;
      }

      const res = await removeUserFromOrganisation(user_id, org_id);

      if (res) {
        let title = "";
        const modifierName = await getUserDB(user_req_id);
        const orgName = await getOrg(org_id);
        if (modifierName && orgName) {
          title =
            modifierName.username +
            " vous a retiré de l'organisation \"" +
            orgName.title +
            '".';
        }

        await addNotification(title, user_id);
      }

      socket.emit(
        "Application:Organisations:KickUserFromOrgRes",
        res,
        (await getUserDB(user_id))?.username
      );
    }
  );

  socket.on("Application:Organisations:GetIsMember", async (org_id: number) => {
    const userID = await getUserIDFromSocket(socket);
    const member = await isUserInOrg(org_id.toString(), userID);
    socket.emit("Application:Organisations:ReceiveIsMember", member);
  });

  socket.on("Application:Organisations:CheckAdmin", async () => {
    const admin = await isAdminFromSocket(socket);
    socket.emit("Application:Organisations:ReceiveAdmin", admin);
  });
  socket.on("Application:GetOrganisationByID", async (id: number) => {
    if (
      !((await hasOrgPerms(id, await getUserIDFromSocket(socket))) ?? false)
    ) {
      socket.emit("Application:ReceiveOrganisationByID", null);
    } else {
      const org = await getOrg(id);
      socket.emit("Application:ReceiveOrganisationByID", org);
    }
  });

  socket.on(
    "Application:ModifyOrganisation:ModifyOrganisation",
    async (
      id_org: number,
      title: string,
      description: string,
      image: Buffer | undefined
    ) => {
      if (await hasOrgPerms(id_org, await getUserIDFromSocket(socket))) {
        const res = await ModifyOrganisation(id_org, title, description, image);
        socket.emit(
          "Application:ModifyOrganisation:ModifyOrganisationRes",
          res
        );
      } else {
        socket.emit(
          "Application:ModifyOrganisation:ModifyOrganisationRes",
          false
        );
      }
    }
  );
}
