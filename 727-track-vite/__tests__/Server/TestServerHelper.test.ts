import { dirname, join } from "path";
import { describe, expect, test } from "vitest";
import { fileURLToPath } from "url";
import { fromRoot, RandomGen, getIsoString } from "../../server/utils/utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("BackendHelperTests", () => {
  test("should generate random number", () => {
    expect(RandomGen(1, 1)).toBe(1);
  });

  test("should generate random number 2", () => {
    expect(RandomGen(5, 10)).not.toBe(11);
  });

  test("should create ISO string", () => {
    const date = new Date(); // Create date
    date.setDate(27);
    date.setMonth(6);
    date.setFullYear(2727);
    date.setHours(7, 27, 27, 27);
    expect(getIsoString(date)).toBe("2727-07-27T11:27:27.027Z"); // Expect ISO string
  });

  test("should have correct path", () => {
    const res = join(__dirname, "../../");
    expect(fromRoot("")).toBe(res);
  });
});
