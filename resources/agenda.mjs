import * as CJ from "../utils/coljson.mjs";
import * as db from "../db/db-dynamodb.mjs";
// import templateData from "../codigo/simple-clinic-erp-v2/schemas/doctorSchema.json" assert { type: "json" };

async function getDoctorAgenda(ctx, next) {
  let monday = new Date();
  monday.setMonday();
  let sunday = new Date();
  sunday.setSunday();
  let dateBegin = ctx.query.dateBegin || monday.toISOString().substring(0, 10);
  let dateEnd = ctx.query.dateEnd || sunday.toISOString().substring(0, 10);

  var schedule = await db.getDoctorSchedule(ctx.params.doctor);

  var consultations = await db.getConsultationsByIdDate(
    ctx.params.doctor,
    dateBegin,
    dateEnd,
  );

  var col = CJ.createCJ();
  col.type = "agenda";
  col.setTitle("Agenda");
  col.setHref("doctors");
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");

  var availableHours = schedule.forEach((sch) => {
    let itCJ = CJ.createCJItem();
    itCJ.addData("dayOfWeek", sch.dayOfWeek, "Día de la semana", "number");
    itCJ.addData("startTime", sch.opens, "Hora de apertura", "time");
    itCJ.addData("endTime", sch.closes, "Hora de cierre", "time");
    itCJ.group = "availableHour";
    col.addItem(itCJ);
  });

  var cons_items = consultations.forEach((item) => {
    let itCJ = CJ.createCJItem();
    itCJ.setHref("consultation", { consultation: item.PK });

    if (item.invoice || item.associatedVoucher) itCJ.readOnly = true;

    // Data
    itCJ.addData("date", item.date, "Fecha", "date");
    itCJ.addData("start", item.start, "Inicio", "date");
    itCJ.addData("end", item.end, "Fin", "date");
    itCJ.addData(
      "title",
      `${item.patientName} ${item.invoiceId ? "(Facturada)" : ""}${
        item.voucherId ? "(Bono)" : ""
      }`,
      "Info",
      "text",
    );
    itCJ.addData("diagnosis", item.diagnosis, "Diagnóstico", "textarea");
    itCJ.addData(
      "description",
      item.description,
      "Observaciones y tratamiento",
      "textarea",
    );
    itCJ.addData("patient", item.patientFullName, "Paciente", "text");
    itCJ.addData(
      "medicalProcedure",
      item.medicalProcedure,
      "Tipo de sesión",
      "text",
    );
    itCJ.addData("doctor", item.doctorFullName, "Doctor", "text");
    itCJ.addData("invoice", item.invoice, "Factura", "text");
    itCJ.addData(
      "patientVoucher",
      item.associatedVoucher,
      "Bono asociado",
      "text",
    );

    itCJ.group = "consultation";
    col.addItem(itCJ);
  });

  // Queries
  let query1 = CJ.createCJQuery();
  query1.setHref("agenda", { doctor: ctx.params.doctor });
  query1.create("search specific", "searchdate", "Buscar fechas");
  query1.addData("dateBegin", "", "Fecha de inicio", "date");
  query1.addData("dateEnd", "", "Fecha de fin", "date");
  query1.addData("view", "", "Vista", "string");
  col.addQuery(query1);

  let query2 = CJ.createCJQuery();
  query2.setHref("consultations_select_patient", { doctor: ctx.params.doctor });
  query2.create(
    "searchpatient specific",
    "searchpatient",
    "Seleccionar paciente",
  );
  query2.addData("date", "", "Fecha de consulta", "date");
  col.addQuery(query2);

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();
}

export { getDoctorAgenda };
