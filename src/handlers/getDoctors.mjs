import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
import * as CJ from "../utils/coljson.mjs";

const tableName = process.env.SAMPLE_TABLE;

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    throw new Error(
      `getAllItems only accept GET method, you tried: ${event.httpMethod}`,
    );
  }

  var params = {
    TableName: tableName,
    IndexName: "Index",
    IndexName: "GSI1",
    KeyConditionExpression: "SK= :hkey",
    ExpressionAttributeValues: {
      ":hkey": "MEDICO",
    },
  };

  try {
    const data = await ddbDocClient.send(new QueryCommand(params));
    var items = data.Items;
  } catch (err) {
    console.log("Error", err);
  }

  CJ.setAbsURL(event.requestContext.domainName);

  var col = CJ.createCJ();
  col.setHref("doctors");
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");

  for (let item of items) {
    let itCJ = CJ.createCJItem();
    itCJ.setHref("doctor", { doctor: item.PK });
    itCJ.addData("PK", item.PK, "Nombre PK", "text");
    itCJ.addData("SK", item.SK, "Nombre SK", "text");
    itCJ.addData("name", item.name, "Nombre", "text");
    itCJ.addLink("doctorSchedule", { doctor: item.PK });
    itCJ.addLink("agenda", { doctor: item.PK });
    itCJ.addLink("doctorInvoices", { doctor: item.PK });
    itCJ.addLink("doctorStats", { doctor: item.PK });
    col.addItem(itCJ);
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify(col),
  };

  // All log statements are written to CloudWatch
  console.info(
    `response from: ${event.path} statusCode: ${response.statusCode}`,
  );
  return response;
};
