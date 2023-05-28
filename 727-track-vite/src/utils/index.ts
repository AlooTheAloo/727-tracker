import { RangePickerProps } from "antd/es/date-picker";
import { NotificationInstance } from "antd/es/notification/interface";
import dayjs from "dayjs";
import { notificationData } from "./frontend-types.js";
import { NavigateFunction } from "react-router-dom";

const MS_IN_DAY = 86400000;

export interface timeDifInfo {
  display: string;
  danger: boolean;
  time_due: number;
}

const purifyDate = (date: Date) =>
  dayjs(new Date(date))
    .set("seconds", 0)
    .set("minute", 0)
    .set("hours", 0)
    .toDate();

export function getTimeDiff(targetDate: Date, prefix?: string) {
  const today = purifyDate(new Date());
  const date = purifyDate(targetDate);
  const days = Math.round(dayjs(date).diff(today, "days", true));

  let ret: timeDifInfo;
  if (days < 0) {
    ret = {
      display:
        prefix +
        (days == -1
          ? " hier"
          : " il y a " +
            Math.abs(days) +
            " jour" +
            (Math.abs(days) == 1 ? "" : "s")),
      danger: true,
      time_due: days,
    };
  } else if (days < 2) {
    let display = "";
    switch (days) {
      case 0:
        display = " aujourd'hui";
        break;
      case 1:
        display = " demain";
        break;
    }
    ret = {
      display: prefix + display,
      danger: false,
      time_due: days,
    };
  } else {
    ret = {
      display:
        prefix + " dans " + days + " jour" + (Math.abs(days) == 1 ? "" : "s"),
      danger: false,
      time_due: days,
    };
  }
  return ret;
}

/**
 * Retourne toutes les dates avant aujourd'hui pour les désactiver
 * @param current paramètre passé par antd
 * @returns un range de jours à désactiver
 */
export const disabledBeforeToday: RangePickerProps["disabledDate"] = (
  current
) => {
  // Can not select days before today and today
  return current < dayjs().subtract(1, "day").endOf("day");
};

/**
 * Crée une notification selon un API antd et un objet de data de notification
 * @param api L'API à utiliser pour générer la notification
 * @param notificationData La notification à créer
 */
export function generateNotification(
  api: NotificationInstance,
  notificationData: notificationData
) {
  //@ts-ignore
  api[notificationData.status]({
    message: notificationData.title,
    description: notificationData.description,
  });
}
/**
 * Stocke une notification dans le localstorage pour être utilisée après un changement de page
 * @param notificationData La notification à stocker
 * @param callback Méthode à appeler une fois l'action terminée
 */
export function StoreNotification(
  notificationData: notificationData,
  callback?: () => void
) {
  localStorage.setItem("showNotification", JSON.stringify(notificationData));
  if (callback) callback();
}

/**
 * Génère un nombre random entre min et max
 * @param min le minimum
 * @param max le maximum
 * @returns un nombre aléatoire entre min et max
 */
export function RandomGen(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}
