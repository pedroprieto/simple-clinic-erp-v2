import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
import * as CJ from "../utils/coljson.mjs";

// Get the DynamoDB table name from environment variables
const tableName = process.env.SAMPLE_TABLE;

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    throw new Error(
      `getMethod only accept GET method, you tried: ${event.httpMethod}`,
    );
  }

  // Get id from pathParameters from APIGateway because of `/{id}` at template.yaml
  const id = event.pathParameters.id;

  // Get the item from the table
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property
  var params = {
    TableName: tableName,
    Key: { PK: id, SK: "MEDICO" },
  };

  try {
    const data = await ddbDocClient.send(new GetCommand(params));
    var item = data.Item;
  } catch (err) {
    console.log("Error", err);
  }

  if (!item) {
    const response = {
      statusCode: 400,
      body: JSON.stringify({ message: "Not found" }),
    };
    return response;
  }

  CJ.setAbsURL(event.requestContext.domainName);

  var col = CJ.createCJ();
  col.setHref("doctors");
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");

  let itCJ = CJ.createCJItem();
  itCJ.setHref("doctor", { doctor: item.PK });
  itCJ.addData("PK", item.PK, "Nombre PK", "text");
  itCJ.addData("SK", item.SK, "Nombre SK", "text");
  itCJ.addData("name", item.name, "Nombre", "text");
  itCJ.addLink("patients");
  col.addItem(itCJ);

  const response = {
    statusCode: 200,
    body: JSON.stringify({ collection: col }),
  };

  // All log statements are written to CloudWatch
  console.info(
    `response from: ${event.path} statusCode: ${response.statusCode}`,
  );
  return response;
};
