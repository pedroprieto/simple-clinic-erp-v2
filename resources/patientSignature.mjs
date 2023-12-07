import * as CJ from "../utils/coljson.mjs";
import * as db from "../db/db-dynamodb.mjs";
import templateData from "../schemas/patientSchema.json" assert { type: "json" };

async function getPatientSignature(ctx, next) {
  var item = await db.getPatient(ctx.state.clinic, ctx.params.patient);
  if (!item) {
    let err = new Error("No encontrado");
    err.status = 400;
    throw err;
  }

  var col = CJ.createCJ();
  col.type = "template";

  col.setTitle("Firma del paciente");
  col.setHref("patientSignature", { patient: ctx.params.patient });
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");

  // Links
  col.addLink("patient", { patient: item.PK });
  col.addLink("patientVouchers", { patient: item.PK });
  col.addLink("patientConsultations", { patient: item.PK });
  col.addLink("patientInvoices", { patient: item.PK });
  col.addLink("patientAttachments", { patient: item.PK });
  col.addLink("patientSignature", { patient: item.PK });

  // Template
  // col.template = templateData;
  col.addTemplateData(
    "signature",
    item.signature,
    "Firma autorización",
    "signature",
  );

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();
}

async function postPatientSignature(ctx, next) {
  var signature = CJ.parseTemplate(ctx.request.body).signature;

  await db.updateSignature(ctx.params.patient, signature);
  ctx.status = 201;
  ctx.set(
    "location",
    CJ.getLinkCJFormat("patient", { patient: ctx.params.patient }).href,
  );

  return next();
}

export { getPatientSignature, postPatientSignature };
