export type notificationData = {
  title: string;
  description: string;
  status: "destroy" | "error" | "info" | "open" | "success" | "warning";
};
