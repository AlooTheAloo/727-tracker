import {
  notification,
  organisation,
  project,
  task,
} from "../../../../server-client/types.js";
import { dbMongo, disconnectToMongo } from "../database-connection.js";

const collection = dbMongo.collection("administrateur");

/**
 * Supprime l'ensemble des administrateurs
 */
export async function removeAllAdmin() {
  await collection.deleteMany();
}
/**
 * Obtient un administrateur avec son ID
 * @returns Un objet JSON représentant l'admin
 */
export async function getAdmin(user_id: string) {
  return await collection.findOne({ id_user: user_id });
}
/**
 * Obtient l'ensemble des administrateurs
 * @returns Une liste d'objet administrateur
 */
export async function getAllAdmin() {
  return await collection.find().toArray();
}

/**
 * Ajoute un administrateur dans la base de données
 * @param user_id L'ID de l'utilisateur qui devient un administrateur
 */
export async function addAdmin(user_id: string) {
  const admin = {
    id_user: user_id,
    tasks: [],
    projects: [],
    organisations: [],
  };
  await collection.insertOne(admin);
}

/**
 * Supprime un administrateur
 * @param user_id Le ID relié à l'administrateur
 */
export async function removeAdmin(user_id: string) {
  await collection.deleteOne({ id_user: user_id });
}

/**
 * Réinitialise les tâches, projets et organisations supprimés par l'administrateur. Principalement utilisée dans un contexte de test
 * @param user_id L'ID relié à l'administrateur que l'on veut réinitialiser
 */
export async function resetAdmin(user_id: string) {
  await collection.updateOne(
    { id_user: user_id },
    {
      $set: {
        tasks: [],
        projects: [],
        organisations: [],
      },
    }
  );
}

/**
 * Enregistre dans l'administrateur une tâche supprimée par celui-ci
 * @param user_id L'ID relié à l'administrateur
 * @param deletedTask La tâche qui a été supprimée
 */
export async function logAdminTask(user_id: string, deletedTask: task) {
  await collection.updateOne(
    { id_user: user_id },
    {
      $push: {
        tasks: deletedTask,
      },
    }
  );
}

/**
 * Enregistre dans l'administrateur un projet supprimé par celui-ci
 * @param user_id L'ID relié à l'administrateur
 * @param deletedTask Le projet qui a été supprimé
 */
export async function logAdminProject(
  user_id: string,
  deletedProject: project
) {
  await collection.updateOne(
    { id_user: user_id },
    {
      $push: {
        projects: deletedProject,
      },
    }
  );
}

/**
 * Enregistre dans l'administrateur une organisation supprimée par celui-ci
 * @param user_id L'ID relié à l'administrateur
 * @param deletedTask L'organisation qui a été supprimée
 */
export async function logAdminOrg(user_id: string, deletedOrg: organisation) {
  await collection.updateOne(
    { id_user: user_id },
    {
      $push: {
        organisations: deletedOrg,
      },
    }
  );
}
