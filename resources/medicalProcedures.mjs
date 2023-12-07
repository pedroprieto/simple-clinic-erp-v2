import * as CJ from "../utils/coljson.mjs";
import * as db from "../db/db-dynamodb.mjs";
// import templateData from "../codigo/simple-clinic-erp-v2/schemas/medicalProcedureSchema.json" assert { type: "json" };

async function getMedicalProcedures(ctx, next) {
  try {
    var items = await db.getMedicalProcedures(ctx.state.clinic);
  } catch (err) {
    console.log("Error", err);
  }

  var col = CJ.createCJ();
  col.setTitle("Tipos de sesión");
  col.setHref("medicalProcedures");
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");
  col.addLink("medicalProcedures");
  col.addLink("consultationVoucherTypes");

  for (let item of items) {
    let itCJ = CJ.createCJItem();
    itCJ.setHref("medicalProcedure", { medicalprocedure: item.PK });

    // Data
    itCJ.addData("name", item.name, "Nombre", "text");
    itCJ.addData("duration", item.duration, "Duración", "time");
    itCJ.addData("price", item.price, "Precio", "number");
    itCJ.addData("vat", item.vat, "IVA (%)", "number");
    itCJ.addData("active", item.active, "Activo", "checkbox");

    col.addItem(itCJ);
  }

  // If no items
  if (items.length == 0) {
    let itCJ = CJ.createCJItem();
    itCJ.readOnly = true;
    itCJ.addData("message", "No hay tipos de sesión", "Mensaje", "text");
    col.addItem(itCJ);
  }

  // Template
  // col.template = templateData;
  col.addTemplateData("name", "", "Nombre", "text");
  col.addTemplateData("duration", "", "Duración", "time");
  col.addTemplateData("price", "", "Precio", "number");
  col.addTemplateData("vat", "", "IVA (%)", "number");
  col.addTemplateData("active", "", "Activo", "checkbox");

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();
}

async function getMedicalProcedure(ctx, next) {
  var item = await db.getMedicalProcedure(
    ctx.state.clinic,
    ctx.params.medicalprocedure,
  );
  if (!item) {
    let err = new Error("No encontrado");
    err.status = 400;
    throw err;
  }

  var col = CJ.createCJ();
  col.setTitle(`Tipo de sesión ${item.name}`);
  col.setHref("medicalProcedures");
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");
  col.addLink("medicalProcedures");
  col.addLink("consultationVoucherTypes");

  let itCJ = CJ.createCJItem();
  itCJ.setHref("medicalProcedure", { medicalprocedure: item.PK });

  // Data
  itCJ.addData("name", item.name, "Nombre", "text");
  itCJ.addData("duration", item.duration, "Duración", "time");
  itCJ.addData("price", item.price, "Precio", "number");
  itCJ.addData("vat", item.vat, "IVA (%)", "number");
  itCJ.addData("active", item.active, "Activo", "checkbox");

  col.addItem(itCJ);

  // Template
  // col.template = templateData;
  col.addTemplateData("name", "", "Nombre", "text");
  col.addTemplateData("duration", "", "Duración", "time");
  col.addTemplateData("price", "", "Precio", "number");
  col.addTemplateData("vat", "", "IVA (%)", "number");
  col.addTemplateData("active", "", "Activo", "checkbox");

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();
}

async function postMedicalProcedure(ctx, next) {
  var medicalProcedureData = CJ.parseTemplate(ctx.request.body);

  var medicalProcedureId = await db.createMedicalProcedure(
    ctx.state.clinic,
    medicalProcedureData,
  );
  ctx.status = 201;

  // Check nextStep
  // If medProc was created during consultation creation, return to next step
  if (medicalProcedureData.nextStep) {
    ctx.set("location", medicalProcedureData.nextStep);
  } else {
    ctx.set(
      "location",
      CJ.getLinkCJFormat("medicalProcedure", {
        medicalprocedure: medicalProcedureId,
      }).href,
    );
  }

  return next();
}

async function deleteMedicalProcedure(ctx, next) {
  await db.deleteMedicalProcedure(
    ctx.state.clinic,
    ctx.params.medicalprocedure,
  );

  ctx.status = 200;
  return next();
}

async function putMedicalProcedure(ctx, next) {
  var medicalProcedureData = CJ.parseTemplate(ctx.request.body);

  await db.updateMedicalProcedure(
    ctx.state.clinic,
    ctx.params.medicalprocedure,
    medicalProcedureData,
  );

  ctx.status = 200;
  ctx.set(
    "location",
    CJ.getLinkCJFormat("medicalProcedure", {
      medicalprocedure: ctx.params.medicalprocedure,
    }).href,
  );

  return next();
}

export {
  getMedicalProcedures,
  getMedicalProcedure,
  postMedicalProcedure,
  deleteMedicalProcedure,
  putMedicalProcedure,
};
