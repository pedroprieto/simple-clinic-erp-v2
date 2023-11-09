import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
import * as CJ from "../utils/coljson.mjs";
import templateData from "../schemas/patientSchema.json" assert { type: "json" };

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
      ":hkey": "PACIENTE",
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
  col.setHref("patients");
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");

  for (let item of items) {
    let itCJ = CJ.createCJItem();
    itCJ.setHref("patient", { patient: item.PK });

    // Data
    itCJ.addData("givenName", item.givenName, "Nombre", "text");
    itCJ.addData("familyName", item.familyName, "Apellidos", "text");
    itCJ.addData("taxID", item.taxID, "NIF", "text");
    itCJ.addData("telephone", item.telephone, "Teléfono", "tel");
    itCJ.addData("address", item.address, "Dirección", "text");
    itCJ.addData("email", item.email, "Email", "email");
    itCJ.addData("birthDate", item.birthDate, "Fecha de nacimiento", "date");
    itCJ.addData(
      "diagnosis",
      item.diagnosis,
      "Diagnóstico principal",
      "textarea",
    );
    itCJ.addData("description", item.description, "Observaciones", "textarea");

    // Links
    itCJ.addLink("patient", { patient: item.PK });
    itCJ.addLink("patientVouchers", { patient: item.PK });
    itCJ.addLink("patientConsultations", { patient: item.PK });
    itCJ.addLink("patientInvoices", { patient: item.PK });
    itCJ.addLink("patientAttachments", { patient: item.PK });
    itCJ.addLink("patientSignature", { patient: item.PK });
    col.addItem(itCJ);
  }

  // Template
  col.template = templateData;
  // col.addTemplateData("givenName", "", "Nombre", "text");
  // col.addTemplateData("familyName", "", "Apellidos", "text");
  // col.addTemplateData("taxID", "", "NIF", "text");
  // col.addTemplateData("telephone", "", "Teléfono", "tel");
  // col.addTemplateData("address", "", "Dirección", "text");
  // col.addTemplateData("email", "", "Email", "email");
  // col.addTemplateData("birthDate", "", "Fecha de nacimiento", "date");
  // col.addTemplateData("diagnosis", "", "Diagnóstico principal", "textarea");
  // col.addTemplateData("description", "", "Observaciones", "textarea");

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
