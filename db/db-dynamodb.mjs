// const { v4: uuidv4 } = require("uuid");
// AWS.config.update({ region: process.env.REGION });
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { daysOfWeek } from "../utils/daysOfWeek.mjs";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
  GetCommand,
  PutCommand,
  DeleteCommand,
  UpdateCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const index1 = "GSI3";

async function clearTable() {
  var params = {
    TableName: process.env.tableName,
  };

  var response = await ddbDocClient.send(new ScanCommand(params));
  for (let item of response.Items) {
    params.Key = { PK: item.PK, SK: item.SK };
    await ddbDocClient.send(new DeleteCommand(params));
  }
  return;
}

async function getDoctors(clinic) {
  return listGSIBySK(clinic + "-MEDICO");
}
async function getDoctor(clinic, doctorId) {
  return getElement(doctorId, clinic + "-MEDICO");
}
async function createDoctor(clinic, doctorData) {
  const PK = "MED-" + uuidv4();
  return createElement(PK, clinic + "-MEDICO", {
    "GSI1-SK": PK,
    ...doctorData,
  });
}
async function deleteDoctor(clinic, doctorId) {
  return deleteElement(doctorId, clinic + "-MEDICO");
}
async function updateDoctor(clinic, doctorId, doctorData) {
  return putElement(doctorId, clinic + "-MEDICO", {
    "GSI1-SK": doctorId,
    ...doctorData,
  });
}

async function getPatients(clinic) {
  return listGSIBySK(clinic + "-PATIENT");
}
async function getPatient(clinic, patientId) {
  return getElement(patientId, clinic + "-PATIENT");
}
async function createPatient(clinic, patientData) {
  const PK = "PAC-" + uuidv4();
  return createElement(PK, clinic + "-PATIENT", {
    "GSI1-SK": PK,
    ...patientData,
  });
}
async function deletePatient(clinic, patientId) {
  return deleteElement(patientId, clinic + "-PATIENT");
}
async function updatePatient(clinic, patientId, patientData) {
  return putElement(patientId, clinic + "-PATIENT", {
    "GSI1-SK": patientId,
    ...patientData,
  });
}

async function getMedicalProcedures(clinic) {
  return listGSIBySK(clinic + "-MEDPROC");
}
async function getMedicalProcedure(clinic, medProcId) {
  return getElement(medProcId, clinic + "-MEDPROC");
}
async function createMedicalProcedure(clinic, medProcData) {
  const PK = "MED-PROC-" + uuidv4();
  return createElement(PK, clinic + "-MEDPROC", {
    "GSI1-SK": PK,
    ...medProcData,
  });
}
async function deleteMedicalProcedure(clinic, medProcId) {
  return deleteElement(medProcId, clinic + "-MEDPROC");
}
async function updateMedicalProcedure(clinic, medProcId, medProcData) {
  return putElement(medProcId, clinic + "-MEDPROC", medProcData);
  return putElement(medProcId, "MEDPROC", {
    "GSI1-SK": medProcId,
    ...medProcData,
  });
}

async function createPatientVoucher(patientId, voucherData) {
  const PK = "VOUCHER-" + uuidv4();
  const SK = patientId;
  const GSISK = "VOUCHER-" + voucherData.numberOfConsultations;
  return createElement(PK, SK, { "GSI1-SK": GSISK, ...voucherData });
}
async function deletePatientVoucher(voucherId, patientId) {
  return deleteElement(voucherId, patientId);
}

async function getConsultationVoucherTypes(clinic) {
  return listGSIBySK(clinic + "-VOUCHERTYPE");
}
async function getConsultationVoucherType(clinic, consultationVoucherTypeId) {
  return getElement(consultationVoucherTypeId, clinic + "-VOUCHERTYPE");
}
async function createConsultationVoucherType(
  clinic,
  consultationVoucherTypeData,
) {
  const PK = "VOUCHERTYPE-" + uuidv4();
  return createElement(PK, clinic + "-VOUCHERTYPE", {
    "GSI1-SK": PK,
    ...consultationVoucherTypeData,
  });
}
async function deleteConsultationVoucherType(clinic, consultationVoucherId) {
  return deleteElement(consultationVoucherId, clinic + "-VOUCHERTYPE");
}
async function updateConsultationVoucherType(
  clinic,
  consultationVoucherId,
  consultationVoucherData,
) {
  return putElement(consultationVoucherId, clinic + "-VOUCHERTYPE", {
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

async function getAttachmentsByPatientId(patientId) {
  return queryTableByPKStartSK(patientId, "ATTACH");
}

async function createPatientAttachment(patientId, name, type, extension) {
  let SK = "ATTACH-" + uuidv4();
  if (extension) SK += `.${extension}`;
  createElement(patientId, SK, { name, type, extension });
  return SK;
}

async function deletePatientAttachment(patientId, attachmentId) {
  return deleteElement(patientId, attachmentId);
}

async function createConsultation(
  clinic,
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
            SK: clinic + "-CONS-DATA",
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

async function getConsultation(clinic, consultationId) {
  let el = await getElement(consultationId, clinic + "-CONS-DATA");
  el.date = el["GSI1-SK"].replace("CONS-", "");
  return el;
}

async function deleteConsultation(clinic, consultationId) {
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
    if (item.SK == clinic + "-CONS-DATA") {
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
  return queryGSIByDate(entityId, "CONS-" + dateBegin, "CONS-" + dateEnd);
}

async function getConsultationsById(entityId) {
  return queryGSIBySKStartSK(entityId, "CONS-");
}

async function getVouchersById(entityId) {
  return queryGSIBySKStartSK(entityId, "VOUCHER-");
}

async function getPatientVoucherById(patientId, voucherId) {
  return getElement(voucherId, patientId);
}

async function getInvoiceById(clinic, invoiceId) {
  return getElement(invoiceId, clinic + "-INVOICE-DATA");
}

async function getInvoicesByIdDate(entityId, dateBegin, dateEnd) {
  return queryGSIByDate(entityId, "INV-" + dateBegin, "INV-" + dateEnd);
}

async function getAvailablePatientVouchers(patientId) {
  var params = {
    TableName: process.env.tableName,
    IndexName: index1,
    ExpressionAttributeNames: {
      "#GSI1SK": "GSI1-SK",
    },
    KeyConditionExpression: "SK= :skey AND #GSI1SK BETWEEN :begin AND :end",
    ExpressionAttributeValues: {
      ":skey": patientId,
      ":begin": "VOUCHER-1",
      ":end": "VOUCHER-Z",
    },
  };

  const response = await ddbDocClient.send(new QueryCommand(params));
  return response.Items || [];
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

async function getCurrentInvNumber(doctorId, invYear) {
  return getElement(doctorId, `NUMINV-${invYear}`);
}

async function createInvoiceForConsultation(
  clinic,
  consultationId,
  invoiceData,
  curInvNumber,
  newInvoiceNumber,
  invYear,
) {
  // Update consultation only if it has no voucher or other invoice
  // Also, check invoice number
  const invoiceId = "INV-" + uuidv4();
  const input = {
    TransactItems: [
      {
        Update: {
          TableName: process.env.tableName,
          Key: { PK: invoiceData.doctorId, SK: `NUMINV-${invYear}` },
          ConditionExpression: curInvNumber
            ? `invoiceNumber = :curInvoiceNumber`
            : "attribute_not_exists(invoiceNumber)",
          UpdateExpression: "set invoiceNumber= :invoiceNumber",
          ExpressionAttributeValues: curInvNumber
            ? {
                ":invoiceNumber": newInvoiceNumber,
                ":curInvoiceNumber": curInvNumber,
              }
            : {
                ":invoiceNumber": newInvoiceNumber,
              },
        },
      },
      {
        Update: {
          TableName: process.env.tableName,
          Key: { PK: consultationId, SK: clinic + "-CONS-DATA" },
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
          Key: { PK: consultationId, SK: invoiceData.doctorId },
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
          Item: { PK: invoiceId, SK: clinic + "-INVOICE-DATA", ...invoiceData },
          ConditionExpression: "attribute_not_exists(PK)",
        },
      },
      // {
      //   Put: {
      //     TableName: process.env.tableName,
      //     Item: { PK: invoiceId, SK: `INVOICEITEM-${consultationId}` },
      //   },
      // },
      {
        Put: {
          TableName: process.env.tableName,
          Item: {
            PK: invoiceId,
            SK: invoiceData.doctorId,
            "GSI1-SK": `INV-${invoiceData.date}`,
            ...invoiceData,
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
            ...invoiceData,
          },
        },
      },
    ],
  };
  const command = new TransactWriteCommand(input);
  const response = await client.send(command);
}

async function createInvoiceForVoucher(
  clinic,
  voucherId,
  invoiceData,
  curInvNumber,
  newInvoiceNumber,
  invYear,
) {
  const invoiceId = "INV-" + uuidv4();
  const input = {
    TransactItems: [
      {
        Update: {
          TableName: process.env.tableName,
          Key: { PK: invoiceData.doctorId, SK: `NUMINV-${invYear}` },
          ConditionExpression: curInvNumber
            ? `invoiceNumber = :curInvoiceNumber`
            : "attribute_not_exists(invoiceNumber)",
          UpdateExpression: "set invoiceNumber= :invoiceNumber",
          ExpressionAttributeValues: curInvNumber
            ? {
                ":invoiceNumber": newInvoiceNumber,
                ":curInvoiceNumber": curInvNumber,
              }
            : {
                ":invoiceNumber": newInvoiceNumber,
              },
        },
      },
      {
        Update: {
          TableName: process.env.tableName,
          Key: { PK: voucherId, SK: invoiceData.patientId },
          UpdateExpression: "set invoiceId= :invoiceId",
          ExpressionAttributeValues: {
            ":invoiceId": invoiceId,
          },
        },
      },
      {
        Put: {
          TableName: process.env.tableName,
          Item: { PK: invoiceId, SK: clinic + "-INVOICE-DATA", ...invoiceData },
          ConditionExpression: "attribute_not_exists(PK)",
        },
      },
      // {
      //   Put: {
      //     TableName: process.env.tableName,
      //     Item: { PK: invoiceId, SK: `INVOICEITEM-${voucherId}` },
      //   },
      // },
      {
        Put: {
          TableName: process.env.tableName,
          Item: {
            PK: invoiceId,
            SK: invoiceData.doctorId,
            "GSI1-SK": `INV-${invoiceData.date}`,
            ...invoiceData,
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
            ...invoiceData,
          },
        },
      },
    ],
  };
  const command = new TransactWriteCommand(input);
  const response = await client.send(command);
}

async function assignPatientVoucherToConsultation(
  clinic,
  consultationId,
  voucherId,
  patientId,
  doctorId,
  remainingConsultations,
) {
  // Update consultation only if it has no voucher or other invoice
  const input = {
    TransactItems: [
      // TODO: improve
      {
        Update: {
          TableName: process.env.tableName,
          Key: { PK: consultationId, SK: doctorId },
          ConditionExpression:
            "attribute_not_exists(invoiceId) and attribute_not_exists(voucherId)",
          UpdateExpression: "set voucherId= :voucherId",
          ExpressionAttributeValues: {
            ":voucherId": voucherId,
          },
        },
      },
      {
        Update: {
          TableName: process.env.tableName,
          Key: { PK: consultationId, SK: patientId },
          ConditionExpression:
            "attribute_not_exists(invoiceId) and attribute_not_exists(voucherId)",
          UpdateExpression: "set voucherId= :voucherId",
          ExpressionAttributeValues: {
            ":voucherId": voucherId,
          },
        },
      },
      {
        Update: {
          TableName: process.env.tableName,
          Key: { PK: consultationId, SK: clinic + "-CONS-DATA" },
          ConditionExpression:
            "attribute_not_exists(invoiceId) and attribute_not_exists(voucherId)",
          UpdateExpression: "set voucherId= :voucherId",
          ExpressionAttributeValues: {
            ":voucherId": voucherId,
          },
        },
      },
      {
        Update: {
          TableName: process.env.tableName,
          Key: { PK: voucherId, SK: patientId },
          ConditionExpression: "#remCons > :minCons",
          UpdateExpression: "set #GSISK = :GSISK, #remCons = :remCons",
          ExpressionAttributeNames: {
            "#GSISK": "GSI1-SK",
            "#remCons": "remainingConsultations",
          },
          ExpressionAttributeValues: {
            ":GSISK": "VOUCHER-" + remainingConsultations,
            ":remCons": remainingConsultations,
            ":minCons": 1,
          },
        },
      },
      ,
    ],
  };
  const command = new TransactWriteCommand(input);
  const response = await client.send(command);
}

async function deletePatientVoucherFromConsultation(
  clinic,
  consultationId,
  voucherId,
  patientId,
  doctorId,
  remainingConsultations,
) {
  // Update consultation only if it has no voucher or other invoice
  const input = {
    TransactItems: [
      // TODO: improve
      {
        Update: {
          TableName: process.env.tableName,
          Key: { PK: consultationId, SK: doctorId },
          UpdateExpression: "remove voucherId",
        },
      },
      {
        Update: {
          TableName: process.env.tableName,
          Key: { PK: consultationId, SK: patientId },
          UpdateExpression: "remove voucherId",
        },
      },
      {
        Update: {
          TableName: process.env.tableName,
          Key: { PK: consultationId, SK: clinic + "-CONS-DATA" },
          UpdateExpression: "remove voucherId",
        },
      },
      {
        Update: {
          TableName: process.env.tableName,
          Key: { PK: voucherId, SK: patientId },
          UpdateExpression: "set #GSISK = :GSISK, #remCons = :remCons",
          ExpressionAttributeNames: {
            "#GSISK": "GSI1-SK",
            "#remCons": "remainingConsultations",
          },
          ExpressionAttributeValues: {
            ":GSISK": "VOUCHER-" + remainingConsultations,
            ":remCons": remainingConsultations,
          },
        },
      },
      ,
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

async function queryGSIByDate(SK, begin, end) {
  var params = {
    TableName: process.env.tableName,
    IndexName: index1,
    ExpressionAttributeNames: {
      "#GSI1SK": "GSI1-SK",
    },
    KeyConditionExpression: "SK= :skey AND #GSI1SK BETWEEN :begin AND :end",
    ExpressionAttributeValues: {
      ":skey": SK,
      ":begin": begin,
      ":end": end,
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
  getAvailablePatientVouchers,
  getPatientVoucherById,
  assignPatientVoucherToConsultation,
  deletePatientVoucherFromConsultation,
  getInvoicesByIdDate,
  getInvoiceById,
  createInvoiceForVoucher,
  getAttachmentsByPatientId,
  createPatientAttachment,
  deletePatientAttachment,
  getCurrentInvNumber,
  clearTable,
};
