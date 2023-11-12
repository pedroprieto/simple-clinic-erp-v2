import * as CJ from "../utils/coljson.mjs";
import * as db from "../db/db-dynamodb.mjs";
import templateData from "../schemas/patientSchema.json" assert { type: "json" };

async function getPatients(ctx, next) {
  try {
    var items = await db.getPatients();
  } catch (err) {
    console.log("Error", err);
  }

  var col = CJ.createCJ();
  col.setTitle("Pacientes");
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

  // If no items
  if (items.length == 0) {
    let itCJ = CJ.createCJItem();
    itCJ.readOnly = true;
    itCJ.addData("message", "No hay pacientes", "Mensaje", "text");
    col.addItem(itCJ);
  }

  // Template
  // col.template = templateData;
  col.addTemplateData("givenName", "", "Nombre", "text");
  col.addTemplateData("familyName", "", "Apellidos", "text");
  col.addTemplateData("taxID", "", "NIF", "text");
  col.addTemplateData("telephone", "", "Teléfono", "tel");
  col.addTemplateData("address", "", "Dirección", "text");
  col.addTemplateData("email", "", "Email", "email");
  col.addTemplateData("birthDate", "", "Fecha de nacimiento", "date");
  col.addTemplateData("diagnosis", "", "Diagnóstico principal", "textarea");
  col.addTemplateData("description", "", "Observaciones", "textarea");

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();
}

async function getPatient(ctx, next) {
  var item = await db.getPatient(ctx.params.patient);
  if (!item) {
    let err = new Error("No encontrado");
    err.status = 400;
    throw err;
  }

  var col = CJ.createCJ();
  col.setTitle(`Paciente ${item.givenName} ${item.familyName}`);
  col.setHref("patients");
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");

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
  col.addLink("patient", { patient: item.PK });
  col.addLink("patientVouchers", { patient: item.PK });
  col.addLink("patientConsultations", { patient: item.PK });
  col.addLink("patientInvoices", { patient: item.PK });
  col.addLink("patientAttachments", { patient: item.PK });
  col.addLink("patientSignature", { patient: item.PK });

  col.addItem(itCJ);

  // Template
  // col.template = templateData;
  col.addTemplateData("givenName", "", "Nombre", "text");
  col.addTemplateData("familyName", "", "Apellidos", "text");
  col.addTemplateData("taxID", "", "NIF", "text");
  col.addTemplateData("telephone", "", "Teléfono", "tel");
  col.addTemplateData("address", "", "Dirección", "text");
  col.addTemplateData("email", "", "Email", "email");
  col.addTemplateData("birthDate", "", "Fecha de nacimiento", "date");
  col.addTemplateData("diagnosis", "", "Diagnóstico principal", "textarea");
  col.addTemplateData("description", "", "Observaciones", "textarea");

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();
}

async function postPatient(ctx, next) {
  var patientData = CJ.parseTemplate(ctx.request.body);

  var patientId = await db.createPatient(patientData);
  ctx.status = 201;

  // Check nextStep
  // If patient was created during consultation creation, return to next step
  if (patientData.nextStep) {
    ctx.set("location", patientData.nextStep);
  } else {
    ctx.set(
      "location",
      CJ.getLinkCJFormat("patient", { patient: patientId }).href,
    );
  }

  return next();
}

async function deletePatient(ctx, next) {
  await db.deletePatient(ctx.params.patient);

  ctx.status = 200;
  return next();
}

async function putPatient(ctx, next) {
  var patientData = CJ.parseTemplate(ctx.request.body);

  await db.updatePatient(ctx.params.patient, patientData);

  ctx.status = 200;
  ctx.set(
    "location",
    CJ.getLinkCJFormat("patient", { patient: ctx.params.patient }).href,
  );

  return next();
}

export { getPatients, getPatient, postPatient, deletePatient, putPatient };
