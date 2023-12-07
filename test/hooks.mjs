import * as db from "../db/db-dynamodb.mjs";
export const mochaHooks = {
  async beforeAll() {
    await db.clearTable();
  },
};
