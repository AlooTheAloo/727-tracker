import {
  notification,
  organisation,
  project,
  task,
} from "../../../../server-client/types.js";
import { Log } from "../../logging.js";
import { dbMongo, disconnectToMongo } from "../database-connection.js";

const collectionNotification = dbMongo.collection("notification");
const collectionCounter = dbMongo.collection("counter");
const collections = dbMongo.collections();
/**
 * Ajoute une notification dans la base de données
 * @param notification la notification a ajouter
 * @returns vrai si tout marche, sinon faux s'il y a une erreur
 */
export async function addNotification(_title: string, _user_id: string) {
  try {
    const allCollections = await collections;
    let hasCounter = false;
    allCollections.forEach((element) => {
      if (element.collectionName == "counter") hasCounter = true;
    });
    if (!hasCounter) {
      //#WeWillRemember (if you know you know)
      await createCounter();
    }
    let _id_notification = await getAndModifySequence();

    const notification: notification = {
      id_notification: _id_notification,
      title: _title,
      id_user: _user_id,
      isSeen: "0",
    };
    await collectionNotification.insertOne(notification);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Crée la collection pour le compteur de l'ID de notification
 */
export async function createCounter() {
  await collectionCounter.insertOne({ seq: 0 });
}

/**
 * Incrémente la séquence de la collection counter dans mongoDB de 1
 */
export async function getAndModifySequence() {
  let doc = (await collectionCounter.find().toArray())[0];
  collectionCounter.updateOne({ seq: doc.seq }, { $inc: { seq: 1 } });
  return doc.seq;
}

/**
 * Obtient les notifications d'un utilisateur
 * @param user_id l'ID de l'utilisateur
 */
export async function getUserNotification(user_id: string) {
  const allNotifications = await collectionNotification
    .find({ id_user: user_id })
    .toArray();
  return allNotifications;
}

/**
 * Supprime une notification selon son ID
 * @param notification_id l'ID de la notification
 * @returns vrai si tout marche, sinon faux s'il y a une erreur
 */
export async function deleteNotification(notification_id: string) {
  try {
    await collectionNotification.deleteOne({
      id_notification: notification_id,
    });
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Marque une notification comme étant vue selon son ID
 * @param notification_id l'ID de la notification
 * @returns vrai si tout marche, sinon faux s'il y a une erreur
 */
export async function seeNotification(notification_id: string) {
  let doc = (
    await collectionNotification
      .find({ id_notification: notification_id })
      .toArray()
  )[0];
  collectionNotification.updateOne(
    { id_notification: notification_id },
    { $set: { isSeen: "1" } }
  );
}

/**
 * Trouve les notifications qui ne sont pas vue
 * @param notification_id l'ID de la notification
 * @returns Les notifications qui ne sont pas vue
 */
export async function getUnseenNotification(id_user: string) {
  const allNotifications = await collectionNotification
    .find({ isSeen: "0", id_user: id_user })
    .toArray();
  return allNotifications;
}

/**
 * Trouve le nombre de notifications qui ne sont pas vue
 * @param notification_id l'ID de la notification
 * @returns Le nombre de notifications qui ne sont pas vue
 */
export async function getNumberUnseenNotification() {
  return await getUnseenNotification.length;
}
