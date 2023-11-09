import * as CJ from "../utils/coljson.mjs";
import * as db from "../db/db-dynamodb.mjs";
import templateData from "../schemas/doctorSchema.json" assert { type: "json" };

async function getDoctors(ctx, next) {
  try {
    var items = await db.getDoctors();
  } catch (err) {
    console.log("Error", err);
  }

  var col = CJ.createCJ();
  col.setHref("doctors");
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");

  for (let item of items) {
    let itCJ = CJ.createCJItem();
    itCJ.setHref("doctor", { doctor: item.PK });

    // Data
    itCJ.addData("givenName", item.givenName, "Nombre", "text");
    itCJ.addData("familyName", item.familyName, "Apellidos", "text");
    itCJ.addData("taxID", item.taxID, "NIF", "text");
    itCJ.addData("telephone", item.telephone, "Teléfono", "tel");
    itCJ.addData("address", item.address, "Dirección", "text");
    itCJ.addData("email", item.email, "Email", "email");

    // Links
    itCJ.addLink("doctorSchedule", { doctor: item.PK });
    itCJ.addLink("agenda", { doctor: item.PK });
    itCJ.addLink("doctorInvoices", { doctor: item.PK });
    itCJ.addLink("doctorStats", { doctor: item.PK });
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

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();
}

async function getDoctor(ctx, next) {
  var item = await db.getDoctor(ctx.params.doctor);
  if (!item) {
    let err = new Error("No encontrado");
    err.status = 400;
    throw err;
  }

  var col = CJ.createCJ();
  col.setHref("doctors");
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");

  let itCJ = CJ.createCJItem();
  itCJ.setHref("doctor", { doctor: item.PK });

  // Data
  itCJ.addData("givenName", item.givenName, "Nombre", "text");
  itCJ.addData("familyName", item.familyName, "Apellidos", "text");
  itCJ.addData("taxID", item.taxID, "NIF", "text");
  itCJ.addData("telephone", item.telephone, "Teléfono", "tel");
  itCJ.addData("address", item.address, "Dirección", "text");
  itCJ.addData("email", item.email, "Email", "email");

  // Links
  col.addLink("doctor", { doctor: item.PK });
  col.addLink("doctorSchedule", { doctor: item.PK });
  col.addLink("agenda", { doctor: item.PK });
  col.addLink("doctorInvoices", { doctor: item.PK });
  col.addLink("doctorStats", { doctor: item.PK });

  col.addItem(itCJ);

  // Template
  col.template = templateData;

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();
}

export { getDoctors, getDoctor };
