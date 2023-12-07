import * as CJ from "../utils/coljson.mjs";
import * as db from "../db/db-dynamodb.mjs";

async function getPatientVouchers(ctx, next) {
  var vouchers = await db.getVouchersById(ctx.params.patient);

  var col = CJ.createCJ();
  col.setTitle("Bonos del paciente");
  col.setHref("patientVouchers", { patient: ctx.params.patient });
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");

  col.addLink("patient", { patient: ctx.params.patient });
  col.addLink("patientVouchers", { patient: ctx.params.patient });
  col.addLink("patientConsultations", { patient: ctx.params.patient });
  col.addLink("patientInvoices", { patient: ctx.params.patient });
  col.addLink("patientAttachments", { patient: ctx.params.patient });
  col.addLink("patientSignature", { patient: ctx.params.patient });

  vouchers.forEach((item) => {
    let itCJ = CJ.createCJItem();
    itCJ.setHref("patientVoucher", {
      patient: ctx.params.patient,
      patientVoucher: item.PK,
    });

    itCJ.noVisit = true;
    if (item.invoiceId) itCJ.readOnly = true;

    // Data
    itCJ.addData(
      "medicalProcedure",
      item.medicalProcedure,
      "Tipo de sesión",
      "text",
    );
    itCJ.addData("name", item.name, "Nombre", "text");
    itCJ.addData(
      "numberOfConsultations",
      item.numberOfConsultations,
      "Número de sesiones",
      "number",
    );
    itCJ.addData("price", item.price, "Precio", "number");
    itCJ.addData("vat", item.vat, "IVA (%)", "number");
    itCJ.addData(
      "remainignConsultations",
      item.remainingConsultations,
      "Consultas restantes",
      "number",
    );

    // Links

    if (!item.invoiceId) {
      itCJ.addLink("voucherAssignInvoice", {
        patientVoucher: item.PK,
        patient: ctx.params.patient,
      });
    } else {
      itCJ.addLink("invoice", {
        invoice: item.invoiceId,
      });
    }

    col.addItem(itCJ);
  });

  // If no items
  if (vouchers.length == 0) {
    let itCJ = CJ.createCJItem();
    itCJ.readOnly = true;
    itCJ.addData(
      "message",
      "No hay bonos para este paciente",
      "Mensaje",
      "text",
    );
    col.addItem(itCJ);
  }

  // Template
  col.addTemplateData("consultationVoucherType", "", "Tipo de bono", "select", {
    required: true,
    suggest: { related: "consultationVoucherList", value: "id", text: "name" },
  });
  col.template.type = "post-only";

  // Related
  col.related = {};
  let voucherList = (col.related.consultationVoucherList =
    await db.getConsultationVoucherTypes(ctx.state.clinic));

  col.related.consultationVoucherList = voucherList.map((el) => {
    return {
      id: el.PK,
      name: el.name,
    };
  });

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();
}

async function postPatientVoucher(ctx, next) {
  var data = CJ.parseTemplate(ctx.request.body);
  let voucherTypeId = data.consultationVoucherType;

  var voucherType = await db.getConsultationVoucherType(
    ctx.state.clinic,
    voucherTypeId,
  );

  let voucherData = {
    name: voucherType.name,
    medicalProcedure: voucherType.medicalProcedure,
    price: voucherType.price,
    vat: voucherType.vat,
    numberOfConsultations: voucherType.numberOfConsultations,
    remainingConsultations: voucherType.numberOfConsultations,
  };

  let voucherId = await db.createPatientVoucher(
    ctx.params.patient,
    voucherData,
  );

  ctx.status = 201;
  ctx.set(
    "location",
    CJ.getLinkCJFormat("patientVouchers", {
      patient: ctx.params.patient,
    }).href,
  );

  return next();
}

async function deletePatientVoucher(ctx, next) {
  await db.deletePatientVoucher(ctx.params.patientVoucher, ctx.params.patient);

  ctx.status = 200;
  return next();
}

export { getPatientVouchers, postPatientVoucher, deletePatientVoucher };
