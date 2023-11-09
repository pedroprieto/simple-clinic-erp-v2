// const { v4: uuidv4 } = require("uuid");
// AWS.config.update({ region: process.env.REGION });
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
  PutCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const index1 = "GSI1";

async function getDoctors() {
  return listGSIBySK("MEDICO");
}
async function getDoctor(doctorId) {
  return getElement(doctorId, "MEDICO");
}
async function createDoctor(doctorData) {
  const PK = "MED-" + uuidv4();
  return createElement(PK, "MEDICO", doctorData);
}
async function deleteDoctor(doctorId) {
  return deleteElement(doctorId, "MEDICO");
}
async function updateDoctor(doctorId, doctorData) {
  return updateElement(doctorId, "MEDICO", doctorData);
}

async function getPatients() {
  return listGSIBySK("PATIENT");
}
async function getPatient(patientId) {
  return getElement(patientId, "PATIENT");
}
async function createPatient(patientData) {
  const PK = "PAC-" + uuidv4();
  return createElement(PK, "PATIENT", patientData);
}
async function deletePatient(patientId) {
  return deleteElement(patientId, "PATIENT");
}
async function updatePatient(patientId, patientData) {
  return updateElement(patientId, "PATIENT", patientData);
}

async function getMedicalProcedures() {
  return listGSIBySK("MEDPROC");
}
async function getMedicalProcedure(medProcId) {
  return getElement(medProcId, "MEDPROC");
}
async function createMedicalProcedure(medProcData) {
  const PK = "MED-PROC-" + uuidv4();
  return createElement(PK, "MEDPROC", medProcData);
}
async function deleteMedicalProcedure(medProcId) {
  return deleteElement(medProcId, "MEDPROC");
}
async function updateMedicalProcedure(medProcId, medProcData) {
  return updateElement(medProcId, "MEDPROC", medProcData);
}

async function getConsultationVoucherTypes() {
  return listGSIBySK("VOUCHERTYPE");
}
async function getConsultationVoucherType(consultationVoucherTypeId) {
  return getElement(consultationVoucherTypeId, "VOUCHERTYPE");
}
async function createConsultationVoucherType(consultationVoucherTypeData) {
  const PK = "VOUCHERTYPE-" + uuidv4();
  return createElement(PK, "VOUCHERTYPE", consultationVoucherTypeData);
}
async function deleteConsultationVoucherType(consultationVoucherId) {
  return deleteElement(consultationVoucherId, "VOUCHERTYPE");
}
async function updateConsultationVoucherType(
  consultationVoucherId,
  consultationVoucherData,
) {
  return updateElement(
    consultationVoucherId,
    "VOUCHERTYPE",
    consultationVoucherData,
  );
}

async function listGSIBySK(SK) {
  var params = {
    TableName: process.env.tableName,
    IndexName: index1,
    KeyConditionExpression: "SK= :hkey",
    ExpressionAttributeValues: {
      ":hkey": SK,
    },
  };

  const response = await ddbDocClient.send(new QueryCommand(params));
  return response.Items || [];
}

async function getElement(PK, SK) {
  var params = {
    TableName: process.env.tableName,
    Key: { PK, SK },
  };

  const response = await ddbDocClient.send(new GetCommand(params));
  return response.Item;
}

async function createElement(PK, SK, data) {
  var params = {
    TableName: process.env.tableName,
    Item: { PK, SK, ...data },
  };

  const response = await ddbDocClient.send(new PutCommand(params));
  return PK;
}

async function deleteElement(PK, SK) {
  var params = {
    TableName: process.env.tableName,
    Key: { PK, SK },
  };

  const response = await ddbDocClient.send(new DeleteCommand(params));
  return response.Item;
}

async function updateElement(PK, SK, doctorData) {
  var params = {
    TableName: process.env.tableName,
    Item: { PK, SK, ...doctorData },
    ConditionExpression: "attribute_exists(PK)",
  };

  const response = await ddbDocClient.send(new PutCommand(params));
  return response;
}

export {
  getDoctors,
  getDoctor,
  createDoctor,
  deleteDoctor,
  updateDoctor,
  getPatients,
  getPatient,
  createPatient,
  deletePatient,
  updatePatient,
  getMedicalProcedures,
  getMedicalProcedure,
  createMedicalProcedure,
  deleteMedicalProcedure,
  updateMedicalProcedure,
  getConsultationVoucherTypes,
  getConsultationVoucherType,
  createConsultationVoucherType,
  deleteConsultationVoucherType,
  updateConsultationVoucherType,
};
