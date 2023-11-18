import serverlessExpress from "@vendia/serverless-express";
import { app } from "./index.mjs";

let handler = serverlessExpress({ app });

export { handler };
