import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
import * as CJ from "../utils/coljson.mjs";
import { v4 as uuidv4 } from "uuid";

const tableName = process.env.SAMPLE_TABLE;

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    throw new Error(
      `postMethod only accepts POST method, you tried: ${event.httpMethod} method.`,
    );
  }

  let data;
  try {
    data = CJ.parseTemplate(JSON.parse(event.body));
  } catch (e) {
    const response = {
      statusCode: 400,
      // TODO: coljson error
      // body: JSON.stringify(body),
    };
    return response;
  }
  const body = JSON.parse(event.body);
  const PK = "MED-" + uuidv4();
  const SK = "MEDICO";
  // const name = data.name;

  // Creates a new item, or replaces an old item with a new item
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property
  var params = {
    TableName: tableName,
    Item: { PK, SK, ...data },
  };

  try {
    const data = await ddbDocClient.send(new PutCommand(params));
    console.log("Success - item added or updated", data);
  } catch (err) {
    console.log("Error", err.stack);
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify(body),
  };

  // All log statements are written to CloudWatch
  console.info(
    `response from: ${event.path} statusCode: ${response.statusCode}`,
  );
  return response;
};
