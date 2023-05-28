import { user } from "../../server-client/types.js";

/**
 * Fait une recherche binaire sur un tableau trié par USER_ID d'utilisateurs
 * Modifié à partir de https://dirask.com/posts/TypeScript-binary-search-algorithm-example-D6OY0p
 * @param array Un tableau trié d'utilisateurs
 * @param userID Le UserID à trouver
 * @returns L'utilisateur trouvé ou null s'il n'existe pas
 */
export const userBinarySearch = (
  array: user[],
  userID: string
): user | null => {
  let index = 0;
  let limit = array.length - 1;
  while (index <= limit) {
    const point = Math.ceil((index + limit) / 2);
    const entry = array[point].id_user;
    if (userID > entry) {
      index = point + 1;
      continue;
    }
    if (userID < entry) {
      limit = point - 1;
      continue;
    }
    return array[point]; // value == entry
  }
  return null;
};
