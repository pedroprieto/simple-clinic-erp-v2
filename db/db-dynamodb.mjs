// const { v4: uuidv4 } = require("uuid");
// AWS.config.update({ region: process.env.REGION });
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const index1 = "GSI1";

async function getDoctors() {
  var params = {
    TableName: process.env.tableName,
    IndexName: index1,
    KeyConditionExpression: "SK= :hkey",
    ExpressionAttributeValues: {
      ":hkey": "MEDICO",
    },
  };

  const response = await ddbDocClient.send(new QueryCommand(params));
  return response.Items || [];
}

async function getDoctor(doctorId) {
  var params = {
    TableName: process.env.tableName,
    Key: { PK: doctorId, SK: "MEDICO" },
  };

  const response = await ddbDocClient.send(new GetCommand(params));
  return response.Item;
}

export { getDoctors, getDoctor };