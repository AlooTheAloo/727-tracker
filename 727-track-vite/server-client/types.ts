export type user = {
  id_user: string;
  username: string;
  id_google: string;
  token_google: string;
  profile_picture: string;
};

export type event = {
  id_event: number;
  title: string;
  date_start: string; // string because timezones
  date_end: string; // string because timezones
  projects_id_project: number;
};

export type organisation = {
  id_org: number;
  title: string;
  description: string;
};

export type organisationUserData = {
  projects: number;
  events: number;
  userCount: number;
  image: string;
  isOwner: boolean;
};

export type project = {
  id_project: number;
  title: string;
  description: string;
  date_created: Date | undefined;
  date_started: Date | undefined;
  date_modified: Date;
  date_todo: Date | undefined;
  date_end: Date | undefined;
  status: status;
  organisations_id_org: number | null;
  user_creator_id: string;
  taskCompleted?: number;
  taskTotal?: number;
};

export type task = {
  id_task: number;
  title: string;
  description: string;
  date_created: Date;
  date_modified: Date;
  date_started?: Date;
  date_todo?: Date;
  date_end?: Date;
  status: status;
  user_creator_id: number;
  projects_id_project?: number;
};

export type notification = {
  id_notification: string;
  title: string;
  id_user: string;
  isSeen: string;
};

export type inviteState = "ValidLink" | "InvalidLink" | "AlreadyInOrganisation";

export type status = "Waiting" | "In Progress" | "Completed";
