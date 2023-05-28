import { dirname, join } from "path";
import { describe, expect, test } from "vitest";
import { fileURLToPath } from "url";
import { userBinarySearch } from "../../src/utils/searches.js";
import { user } from "../../server-client/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("FrontendHelperTests", () => {
  const users: user[] = [
    {
      username: "detah",
      id_user: "1",
      profile_picture: "a",
      id_google: "1",
      token_google: "a",
    },
    {
      username: "detah 2",
      id_user: "2",
      profile_picture: "a",
      id_google: "2",
      token_google: "a",
    },
  ];

  test("should find user", () => {
    expect(userBinarySearch(users, "1")?.username).toBe("detah");
  });

  test("should not find user", () => {
    expect(userBinarySearch(users, "3")).toBeNull();
  });
});
