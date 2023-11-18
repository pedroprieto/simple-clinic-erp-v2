import * as CJ from "../utils/coljson.mjs";
import * as db from "../db/db-dynamodb.mjs";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as fs from "fs";

async function s3savefile(fileId, data) {
  const client = new S3Client();
  const input = {
    Body: data,
    Bucket: process.env.bucketName,
    Key: fileId,
  };
  const command = new PutObjectCommand(input);
  const response = await client.send(command);
}

async function s3deletefile(fileId) {
  const client = new S3Client();
  const input = {
    Bucket: process.env.bucketName,
    Key: fileId,
  };
  const command = new DeleteObjectCommand(input);
  const response = await client.send(command);
}

async function getPatientAttachments(ctx, next) {
  var attachments = await db.getAttachmentsByPatientId(ctx.params.patient);

  var col = CJ.createCJ();
  col.setTitle("Archivos del paciente");
  col.setHref("patientAttachments", { patient: ctx.params.patient });
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");

  col.addLink("patient", { patient: ctx.params.patient });
  col.addLink("patientAttachments", { patient: ctx.params.patient });
  col.addLink("patientConsultations", { patient: ctx.params.patient });
  col.addLink("patientInvoices", { patient: ctx.params.patient });
  col.addLink("patientAttachments", { patient: ctx.params.patient });
  col.addLink("patientSignature", { patient: ctx.params.patient });

  const s3 = new S3Client();

  for (let item of attachments) {
    let itCJ = CJ.createCJItem();
    itCJ.setHref("patientAttachment", {
      patient: ctx.params.patient,
      patientAttachment: item.SK,
    });

    itCJ["noVisit"] = true;

    // Data
    itCJ.addData("name", item.name, "Nombre del archivo", "text");
    itCJ.addData("type", item.type, "Tipo de archivo", "text");

    // Links
    const command = new GetObjectCommand({
      Bucket: process.env.bucketName,
      Key: `${ctx.params.patient}/${item.SK}`,
      ResponseContentDisposition: `attachment; filename="${item.name}"`,
    });
    const url = await getSignedUrl(s3, command, {
      expiresIn: 15 * 60,
    }); // expires in seconds
    itCJ.links = [];
    itCJ.links.push({
      href: url,
      name: "patientAttachmentFile",
      rel: "external",
      prompt: "Archivo adjunto",
    });

    col.addItem(itCJ);
  }

  // If no items
  if (attachments.length == 0) {
    let itCJ = CJ.createCJItem();
    itCJ.readOnly = true;
    itCJ.addData(
      "message",
      "No hay archivos para este paciente",
      "Mensaje",
      "text",
    );
    col.addItem(itCJ);
  }

  // Template
  col.addTemplateData("name", "", "Nombre", "text");
  col.addTemplateData("fileData", "", "Fichero", "file");
  col.template.type = "post-only";
  col.template.contentType = "multipart/form-data";

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();
}

async function getPatientAttachmentFile(ctx, next) {}

async function postPatientAttachment(ctx, next) {
  // Parameter 'name'
  var attachmentName = ctx.request.body.name;
  const patientId = ctx.params.patient;
  if (!attachmentName) {
    ctx.throw(404, "No se encuentra el parámetro name.");
  }

  // Files
  var files = ctx.request.files.fileData;
  if (!files) {
    ctx.throw(404, "No se encuentra el adjunto fileData.");
  }

  let fileList = [];

  // Check if there is one or more files
  if (typeof files[Symbol.iterator] === "function") {
    // Array of files
    fileList = files;
  } else {
    // Single file
    fileList.push(files);
  }

  for (let f of fileList) {
    var data = fs.readFileSync(f.filepath);

    const fileId = await db.createPatientAttachment(
      patientId,
      attachmentName,
      f.mimetype,
    );
    await s3savefile(`${patientId}/${fileId}`, data);
  }

  ctx.status = 201;
  ctx.set(
    "location",
    CJ.getLinkCJFormat("patientAttachments", {
      patient: ctx.params.patient,
    }).href,
  );

  return next();
}

async function deletePatientAttachment(ctx, next) {
  await db.deletePatientAttachment(
    ctx.params.patient,
    ctx.params.patientAttachment,
  );
  await s3deletefile(`${ctx.params.patient}/${ctx.params.patientAttachment}`);

  ctx.status = 200;
  return next();
}

export {
  getPatientAttachments,
  getPatientAttachmentFile,
  postPatientAttachment,
  deletePatientAttachment,
};
