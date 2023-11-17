// const { v4: uuidv4 } = require("uuid");
// AWS.config.update({ region: process.env.REGION });
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { daysOfWeek } from "../utils/daysOfWeek.mjs";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
  PutCommand,
  DeleteCommand,
  UpdateCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const index1 = "GSI3";

async function getDoctors() {
  return listGSIBySK("MEDICO");
}
async function getDoctor(doctorId) {
  return getElement(doctorId, "MEDICO");
}
async function createDoctor(doctorData) {
  const PK = "MED-" + uuidv4();
  return createElement(PK, "MEDICO", { "GSI1-SK": PK, ...doctorData });
}
async function deleteDoctor(doctorId) {
  return deleteElement(doctorId, "MEDICO");
}
async function updateDoctor(doctorId, doctorData) {
  return putElement(doctorId, "MEDICO", {
    "GSI1-SK": doctorId,
    ...doctorData,
  });
}

async function getPatients() {
  return listGSIBySK("PATIENT");
}
async function getPatient(patientId) {
  return getElement(patientId, "PATIENT");
}
async function createPatient(patientData) {
  const PK = "PAC-" + uuidv4();
  return createElement(PK, "PATIENT", { "GSI1-SK": PK, ...patientData });
}
async function deletePatient(patientId) {
  return deleteElement(patientId, "PATIENT");
}
async function updatePatient(patientId, patientData) {
  return putElement(patientId, "PATIENT", {
    "GSI1-SK": patientId,
    ...patientData,
  });
}

async function getMedicalProcedures() {
  return listGSIBySK("MEDPROC");
}
async function getMedicalProcedure(medProcId) {
  return getElement(medProcId, "MEDPROC");
}
async function createMedicalProcedure(medProcData) {
  const PK = "MED-PROC-" + uuidv4();
  return createElement(PK, "MEDPROC", { "GSI1-SK": PK, ...medProcData });
}
async function deleteMedicalProcedure(medProcId) {
  return deleteElement(medProcId, "MEDPROC");
}
async function updateMedicalProcedure(medProcId, medProcData) {
  return putElement(medProcId, "MEDPROC", medProcData);
  return putElement(medProcId, "MEDPROC", {
    "GSI1-SK": medProcId,
    ...medProcData,
  });
}

async function createPatientVoucher(patientId, voucherData) {
  const PK = "VOUCHER-" + uuidv4();
  const SK = patientId;
  const GSISK = "VOUCHER-" + voucherData.numSessions;
  return createElement(PK, SK, { "GSI1-SK": GSISK, ...voucherData });
}
async function deletePatientVoucher(voucherId, patientId) {
  return deleteElement(voucherId, patientId);
}

async function getConsultationVoucherTypes() {
  return listGSIBySK("VOUCHERTYPE");
}
async function getConsultationVoucherType(consultationVoucherTypeId) {
  return getElement(consultationVoucherTypeId, "VOUCHERTYPE");
}
async function createConsultationVoucherType(consultationVoucherTypeData) {
  const PK = "VOUCHERTYPE-" + uuidv4();
  return createElement(PK, "VOUCHERTYPE", {
    "GSI1-SK": PK,
    ...consultationVoucherTypeData,
  });
}
async function deleteConsultationVoucherType(consultationVoucherId) {
  return deleteElement(consultationVoucherId, "VOUCHERTYPE");
}
async function updateConsultationVoucherType(
  consultationVoucherId,
  consultationVoucherData,
) {
  return putElement(consultationVoucherId, "VOUCHERTYPE", {
    "GSI1-SK": PK,
    ...consultationVoucherData,
  });
}

async function getDoctorSchedule(doctorID) {
  return queryTableByPKStartSK(doctorID, "OPENING-HOUR");
}
async function createDoctorSchedule(doctorId, doctorScheduleData) {
  const PK = doctorId;
  const SK = "OPENING-HOUR-" + uuidv4();
  let dayOfWeekText = daysOfWeek.find(
    (d) => d.value == doctorScheduleData.dayOfWeek,
  ).text;

  return createElement(PK, SK, { dayOfWeekText, ...doctorScheduleData });
}
async function deleteDoctorSchedule(doctorId, openingHourId) {
  return deleteElement(doctorId, openingHourId);
}
async function updateDoctorSchedule(doctorId, openingHourId, openingHourData) {
  let dayOfWeekText = daysOfWeek.find(
    (d) => d.value == openingHourData.dayOfWeek,
  ).text;
  return putElement(doctorId, openingHourId, {
    dayOfWeekText,
    ...openingHourData,
  });
}

async function createConsultation(
  doctorId,
  patientId,
  date,
  medicalProcedure,
  other,
) {
  const consultationId = "CONS-" + uuidv4();
  const input = {
    TransactItems: [
      {
        Put: {
          TableName: process.env.tableName,
          Item: {
            PK: consultationId,
            SK: "CONS-DATA",
            "GSI1-SK": "CONS-" + date,
            medicalProcedure,
            doctorId,
            patientId,
            ...other,
          },
          ConditionExpression: "attribute_not_exists(PK)",
        },
      },
      {
        Put: {
          TableName: process.env.tableName,
          Item: {
            PK: consultationId,
            SK: patientId,
            "GSI1-SK": "CONS-" + date,
            ...other,
          },
        },
      },
      {
        Put: {
          TableName: process.env.tableName,
          Item: {
            PK: consultationId,
            SK: doctorId,
            "GSI1-SK": "CONS-" + date,
            ...other,
          },
        },
      },
    ],
  };

  const command = new TransactWriteCommand(input);
  const response = await client.send(command);
  return consultationId;
}

async function getConsultation(consultationId) {
  let el = await getElement(consultationId, "CONS-DATA");
  el.date = el["GSI1-SK"].replace("CONS-", "");
  return el;
}

async function deleteConsultation(consultationId) {
  const input = {
    TransactItems: [],
  };

  let items = await queryTableByPK(consultationId);
  for (let item of items) {
    let delCommand = {
      Delete: {
        TableName: process.env.tableName,
        Key: { PK: consultationId, SK: item.SK },
      },
    };
    if (item.SK == "CONS-DATA") {
      delCommand.Delete.ConditionExpression =
        "attribute_not_exists(invoiceId) and attribute_not_exists(voucherId)";
    }
    input.TransactItems.push(delCommand);
  }

  const command = new TransactWriteCommand(input);
  const response = await client.send(command);
  return;
}

async function getConsultationsByIdDate(entityId, dateBegin, dateEnd) {
  return queryGSIByDate(entityId, dateBegin, dateEnd);
}

async function getConsultationsById(entityId) {
  return queryGSIBySKStartSK(entityId, "CONS-");
}

async function getVouchersById(entityId) {
  return queryGSIBySKStartSK(entityId, "VOUCHER-");
}

async function queryTableByPK(PK) {
  var params = {
    TableName: process.env.tableName,
    KeyConditionExpression: "PK= :hkey",
    ExpressionAttributeValues: {
      ":hkey": PK,
    },
  };

  const response = await ddbDocClient.send(new QueryCommand(params));
  return response.Items || [];
}

async function createInvoiceForConsultation(consultationId, invoiceData) {
  // Update consultation only if it has no voucher or other invoice
  const invoiceId = "INV-" + uuidv4();
  const input = {
    TransactItems: [
      {
        Update: {
          TableName: process.env.tableName,
          Key: { PK: consultationId, SK: "CONS-DATA" },
          ConditionExpression:
            "attribute_not_exists(invoiceId) and attribute_not_exists(voucherId)",
          UpdateExpression: "set invoiceId= :invoiceId",
          ExpressionAttributeValues: {
            ":invoiceId": invoiceId,
          },
        },
      },
      {
        // TODO: how to improve??
        Update: {
          TableName: process.env.tableName,
          Key: { PK: consultationId, SK: invoiceData.seller },
          UpdateExpression: "set invoiceId= :invoiceId",
          ExpressionAttributeValues: {
            ":invoiceId": invoiceId,
          },
        },
      },
      {
        // TODO: how to improve??
        Update: {
          TableName: process.env.tableName,
          Key: { PK: consultationId, SK: invoiceData.patientId },
          UpdateExpression: "set invoiceId= :invoiceId",
          ExpressionAttributeValues: {
            ":invoiceId": invoiceId,
          },
        },
      },
      {
        Put: {
          TableName: process.env.tableName,
          Item: { PK: invoiceId, SK: "INVOICE-DATA" },
          ConditionExpression: "attribute_not_exists(PK)",
        },
      },
      {
        Put: {
          TableName: process.env.tableName,
          Item: { PK: invoiceId, SK: `INVOICEITEM-${consultationId}` },
        },
      },
      {
        Put: {
          TableName: process.env.tableName,
          Item: {
            PK: invoiceId,
            SK: invoiceData.seller,
            "GSI1-SK": `INV-${invoiceData.date}`,
          },
        },
      },
      {
        Put: {
          TableName: process.env.tableName,
          Item: {
            PK: invoiceId,
            SK: invoiceData.patientId,
            "GSI1-SK": `INV-${invoiceData.date}`,
          },
        },
      },
    ],
  };
  const command = new TransactWriteCommand(input);
  const response = await client.send(command);
}

async function queryTableByPKStartSK(PK, SK) {
  var params = {
    TableName: process.env.tableName,
    KeyConditionExpression: "PK= :hkey AND begins_with(SK, :skey)",
    ExpressionAttributeValues: {
      ":hkey": PK,
      ":skey": SK,
    },
  };

  const response = await ddbDocClient.send(new QueryCommand(params));
  return response.Items || [];
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

async function putElement(PK, SK, doctorData) {
  var params = {
    TableName: process.env.tableName,
    Item: { PK, SK, ...doctorData },
    ConditionExpression: "attribute_exists(PK)",
  };

  const response = await ddbDocClient.send(new PutCommand(params));
  return response;
}

async function updateSignature(patientId, signature) {
  var params = {
    TableName: process.env.tableName,
    Key: { PK: patientId, SK: "PATIENT" },
    ConditionExpression: "attribute_exists(PK)",
    UpdateExpression: "set signature = :signature",
    ExpressionAttributeValues: {
      ":signature": signature,
    },
  };

  const response = await ddbDocClient.send(new UpdateCommand(params));
  return response;
}

async function updateConsultation(consultationId, description, diagnosis) {
  var params = {
    TableName: process.env.tableName,
    Key: { PK: consultationId },
    ConditionExpression: "attribute_exists(PK)",
    UpdateExpression: "set description= :description, diagnosis= :diagnosis",
    ExpressionAttributeValues: {
      ":description": description,
      ":diagnosis": diagnosis,
    },
  };
  let items = await queryTableByPK(consultationId);
  let promises = [];
  for (let item of items) {
    params.Key.SK = item.SK;
    promises.push(ddbDocClient.send(new UpdateCommand(params)));
  }

  return promises;
}

async function queryGSIBySKStartSK(PK, SK) {
  var params = {
    TableName: process.env.tableName,
    IndexName: index1,
    KeyConditionExpression: "SK= :hkey AND begins_with(#GSISK, :skey)",
    ExpressionAttributeNames: {
      "#GSISK": "GSI1-SK",
    },
    ExpressionAttributeValues: {
      ":hkey": PK,
      ":skey": SK,
    },
  };

  const response = await ddbDocClient.send(new QueryCommand(params));
  return (
    response.Items.map((el) => {
      el.date = el["GSI1-SK"].replace("CONS-", "");
      return el;
    }) || []
  );
}

async function queryGSIByDate(SK, dateBegin, dateEnd) {
  var params = {
    TableName: process.env.tableName,
    IndexName: index1,
    ExpressionAttributeNames: {
      "#GSI1SK": "GSI1-SK",
    },
    KeyConditionExpression:
      "SK= :skey AND #GSI1SK BETWEEN :dateBegin AND :dateEnd",
    ExpressionAttributeValues: {
      ":skey": SK,
      ":dateBegin": "CONS-" + dateBegin,
      ":dateEnd": "CONS-" + dateEnd,
    },
  };

  const response = await ddbDocClient.send(new QueryCommand(params));
  return response.Items || [];
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
  getDoctorSchedule,
  createDoctorSchedule,
  deleteDoctorSchedule,
  updateDoctorSchedule,
  updateSignature,
  createConsultation,
  getConsultation,
  updateConsultation,
  deleteConsultation,
  getConsultationsByIdDate,
  createInvoiceForConsultation,
  getConsultationsById,
  getVouchersById,
  createPatientVoucher,
  deletePatientVoucher,
};
