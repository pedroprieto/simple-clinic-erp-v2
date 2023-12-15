import * as CJ from "../utils/coljson.mjs";
import * as db from "../db/db-dynamodb.mjs";
// import templateData from "../codigo/simple-clinic-erp-v2/schemas/consultationVoucherTypeSchema.json" assert { type: "json" };

async function getConsultationVoucherTypes(ctx, next) {
  try {
    var items = await db.getConsultationVoucherTypes(ctx.state.clinic);
  } catch (err) {
    console.log("Error", err);
  }

  var col = CJ.createCJ();
  col.setTitle("Tipos de bonos");
  col.setHref("consultationVoucherTypes");
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");
  col.addLink("medicalProcedures");
  col.addLink("consultationVoucherTypes");

  for (let item of items) {
    let itCJ = CJ.createCJItem();
    itCJ.setHref("consultationVoucherType", {
      consultationVoucherType: item.PK,
    });

    // Data
    itCJ.addData("name", item.name, "Nombre", "text");
    itCJ.addData(
      "medicalProcedure",
      item.medicalProcedure,
      "Tipo de sesión",
      "text",
    );
    itCJ.addData(
      "numberOfConsultations",
      item.numberOfConsultations,
      "Número de consultas",
      "number",
    );
    itCJ.addData("price", item.price, "Precio", "number");
    itCJ.addData("vat", item.vat, "IVA (%)", "number");
    itCJ.addData("active", item.active, "Activo", "checkbox");

    col.addItem(itCJ);
  }

  // If no items
  if (items.length == 0) {
    let itCJ = CJ.createCJItem();
    itCJ.readOnly = true;
    itCJ.addData("message", "No hay tipos bonos", "Mensaje", "text");
    col.addItem(itCJ);
  }

  // Template
  // col.template = templateData;
  col.addTemplateData("name", "", "Nombre", "text");
  col.addTemplateData(
    "numberOfConsultations",
    "",
    "Número de consultas",
    "number",
  );
  col.addTemplateData("price", "", "Precio", "number");
  col.addTemplateData("vat", "", "IVA (%)", "number");
  col.addTemplateData("active", "", "Activo", "checkbox");
  col.addTemplateData("medicalProcedure", "", "Tipo de sesión", "select", {
    suggest: { related: "medicalProcedureList", value: "PK", text: "name" },
  });

  // Related
  col.related = {};
  col.related.medicalProcedureList = await db.getMedicalProcedures(
    ctx.state.clinic,
  );

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();
}

async function getConsultationVoucherType(ctx, next) {
  var item = await db.getConsultationVoucherType(
    ctx.state.clinic,
    ctx.params.consultationVoucherType,
  );
  if (!item) {
    let err = new Error("No encontrado");
    err.status = 400;
    throw err;
  }

  var col = CJ.createCJ();
  col.setTitle(`Tipo de bono ${item.name}`);
  col.setHref("consultationVoucherTypes");
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");
  col.addLink("medicalProcedures");
  col.addLink("consultationVoucherTypes");

  let itCJ = CJ.createCJItem();
  itCJ.setHref("consultationVoucherType", { consultationVoucherType: item.PK });

  // Data
  itCJ.addData("name", item.name, "Nombre", "text");
  itCJ.addData(
    "medicalProcedure",
    item.medicalProcedure,
    "Tipo de sesión",
    "text",
  );
  itCJ.addData(
    "numberOfConsultations",
    item.numberOfConsultations,
    "Número de consultas",
    "number",
  );
  itCJ.addData("price", item.price, "Precio", "number");
  itCJ.addData("vat", item.vat, "IVA (%)", "number");
  itCJ.addData("active", item.active, "Activo", "checkbox");

  col.addItem(itCJ);

  // Template
  // col.template = templateData;
  col.addTemplateData("name", "", "Nombre", "text");
  col.addTemplateData(
    "numberOfConsultations",
    "",
    "Número de consultas",
    "number",
  );
  col.addTemplateData("price", "", "Precio", "number");
  col.addTemplateData("vat", "", "IVA (%)", "number");
  col.addTemplateData("active", "", "Activo", "checkbox");

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();
}

async function postConsultationVoucherType(ctx, next) {
  var consultationVoucherTypeData = CJ.parseTemplate(ctx.request.body);

  var consultationVoucherTypeId = await db.createConsultationVoucherType(
    ctx.state.clinic,
    consultationVoucherTypeData,
  );
  ctx.status = 201;
  ctx.set(
    "location",
    CJ.getLinkCJFormat("consultationVoucherType", {
      consultationVoucherType: consultationVoucherTypeId,
    }).href,
  );

  return next();
}

async function deleteConsultationVoucherType(ctx, next) {
  await db.deleteConsultationVoucherType(
    ctx.state.clinic,
    ctx.params.consultationVoucherType,
  );

  ctx.status = 200;
  return next();
}

async function putConsultationVoucherType(ctx, next) {
  var consultationVoucherTypeData = CJ.parseTemplate(ctx.request.body);

  await db.updateConsultationVoucherType(
    ctx.state.clinic,
    ctx.params.consultationVoucherType,
    consultationVoucherTypeData,
  );

  ctx.status = 200;
  ctx.set(
    "location",
    CJ.getLinkCJFormat("consultationVoucherType", {
      consultationVoucherType: ctx.params.consultationVoucherType,
    }).href,
  );

  return next();
}

export {
  getConsultationVoucherTypes,
  getConsultationVoucherType,
  postConsultationVoucherType,
  deleteConsultationVoucherType,
  putConsultationVoucherType,
};
