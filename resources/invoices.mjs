import * as CJ from "../utils/coljson.mjs";
import * as db from "../db/db-dynamodb.mjs";

async function getInvoiceHTML(ctx, next) {
  let invoice = await db.getInvoiceById(ctx.params.invoice);
  await ctx.render("invoice", {
    invoice,
  });
}

async function getPatientInvoices(ctx, next) {
  let today = new Date();
  let threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  let dateBegin =
    ctx.query.dateBegin || threeMonthsAgo.toISOString().substring(0, 10);
  let dateEnd = ctx.query.dateEnd || today.toISOString().substring(0, 10);

  var invoices = await db.getInvoicesByIdDate(
    ctx.params.patient,
    dateBegin,
    dateEnd,
  );

  var col = CJ.createCJ();
  col.setTitle("Bonos del paciente");
  col.setHref("patientInvoices", { patient: ctx.params.patient });
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");

  col.addLink("patient", { patient: ctx.params.patient });
  col.addLink("patientVouchers", { patient: ctx.params.patient });
  col.addLink("patientConsultations", { patient: ctx.params.patient });
  col.addLink("patientInvoices", { patient: ctx.params.patient });
  col.addLink("patientAttachments", { patient: ctx.params.patient });
  col.addLink("patientSignature", { patient: ctx.params.patient });

  invoices.forEach((item) => {
    let itCJ = CJ.createCJItem();
    itCJ.setHref("invoiceHTML", {
      invoice: item.PK,
    });

    itCJ.readOnly = true;

    // Data
    itCJ.addData("date", item.date, "Fecha", "date");
    itCJ.addData("customerName", item.customerName, "Cliente", "text");
    itCJ.addData("sellerName", item.sellerName, "Médico", "text");
    itCJ.addData("incomeTax", item.incomeTax, "IRPF", "number");

    // Links
    itCJ.addLink("invoiceHTML", { invoice: item.PK });

    col.addItem(itCJ);
  });

  // If no items
  if (invoices.length == 0) {
    let itCJ = CJ.createCJItem();
    itCJ.readOnly = true;
    itCJ.addData(
      "message",
      "No hay facturas para este paciente en las fechas seleccionadas",
      "Mensaje",
      "text",
    );
    col.addItem(itCJ);
  }

  // Queries
  let query1 = CJ.createCJQuery();
  query1.setHref("patientInvoices", { patient: ctx.params.patient });
  query1.create("search", "searchdate", "Buscar por fecha");
  query1.addData("dateBegin", dateBegin, "Fecha de inicio", "date");
  query1.addData("dateEnd", dateEnd, "Fecha de fin", "date");
  col.addQuery(query1);

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();
}

async function getDoctorInvoices(ctx, next) {
  let today = new Date();
  let threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  let dateBegin =
    ctx.query.dateBegin || threeMonthsAgo.toISOString().substring(0, 10);
  let dateEnd = ctx.query.dateEnd || today.toISOString().substring(0, 10);

  var invoices = await db.getInvoicesByIdDate(
    ctx.params.doctor,
    dateBegin,
    dateEnd,
  );

  var col = CJ.createCJ();
  col.setTitle("Bonos del médico");
  col.setHref("doctorInvoices", { doctor: ctx.params.doctor });
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");

  // Links
  col.addLink("doctor", { doctor: ctx.params.doctor });
  col.addLink("doctorSchedule", { doctor: ctx.params.doctor });
  col.addLink("agenda", { doctor: ctx.params.doctor });
  col.addLink("doctorInvoices", { doctor: ctx.params.doctor });
  col.addLink("doctorStats", { doctor: ctx.params.doctor });

  invoices.forEach((item) => {
    let itCJ = CJ.createCJItem();
    itCJ.setHref("invoiceHTML", {
      invoice: item.PK,
    });

    itCJ.readOnly = true;

    // Data
    itCJ.addData("date", item.date, "Fecha", "date");
    itCJ.addData("customerName", item.customerName, "Cliente", "text");
    itCJ.addData("sellerName", item.sellerName, "Médico", "text");
    itCJ.addData("incomeTax", item.incomeTax, "IRPF", "number");

    // Links
    itCJ.addLink("invoiceHTML", { invoice: item.PK });

    col.addItem(itCJ);
  });

  // If no items
  if (invoices.length == 0) {
    let itCJ = CJ.createCJItem();
    itCJ.readOnly = true;
    itCJ.addData(
      "message",
      "No hay facturas para este médico en las fechas seleccionadas",
      "Mensaje",
      "text",
    );
    col.addItem(itCJ);
  }

  // Queries
  let query1 = CJ.createCJQuery();
  query1.setHref("doctorInvoices", { doctor: ctx.params.doctor });
  query1.create("search", "searchdate", "Buscar por fecha");
  query1.addData("dateBegin", dateBegin, "Fecha de inicio", "date");
  query1.addData("dateEnd", dateEnd, "Fecha de fin", "date");
  col.addQuery(query1);

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();
}

export { getPatientInvoices, getInvoiceHTML, getDoctorInvoices };
