import * as CJ from "../utils/coljson.mjs";
import * as db from "../db/db-dynamodb.mjs";
import { daysOfWeek } from "../utils/daysOfWeek.mjs";
// import templateData from "../codigo/simple-clinic-erp-v2/schemas/doctorScheduleSchema.json" assert { type: "json" };

async function getDoctorSchedule(ctx, next) {
  try {
    var items = await db.getDoctorSchedule(ctx.params.doctor);
  } catch (err) {
    console.log("Error", err);
  }

  // TODO: improve query. Parallel? One query?
  var doctorData = await db.getDoctor(ctx.state.clinic, ctx.params.doctor);
  if (!doctorData) {
    let err = new Error("No encontrado");
    err.status = 400;
    throw err;
  }

  var col = CJ.createCJ();
  col.setTitle(
    `Horario del doctor ${doctorData.givenName} ${doctorData.familyName}`,
  );
  col.setHref("doctorSchedule", { doctor: ctx.params.doctor });
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");

  // Links
  col.addLink("doctor", { doctor: ctx.params.doctor });
  col.addLink("doctorSchedule", { doctor: ctx.params.doctor });
  col.addLink("agenda", { doctor: ctx.params.doctor });
  col.addLink("doctorInvoices", { doctor: ctx.params.doctor });
  col.addLink("doctorStats", { doctor: ctx.params.doctor });

  for (let item of items) {
    let itCJ = CJ.createCJItem();
    itCJ.setHref("doctorScheduleOpeningHour", {
      openingHour: item.SK,
      doctor: ctx.params.doctor,
    });

    // Data
    itCJ.addData("dayOfWeek", item.dayOfWeekText, "Día de la semana", "text");
    itCJ.addData("opens", item.opens, "Desde", "time");
    itCJ.addData("closes", item.closes, "Hasta", "time");

    col.addItem(itCJ);
  }

  // If no items
  if (items.length == 0) {
    let itCJ = CJ.createCJItem();
    itCJ.readOnly = true;
    itCJ.addData("message", "No hay horario definido", "Mensaje", "text");
    col.addItem(itCJ);
  }

  // Template
  // col.template = templateData;
  col.addTemplateData("dayOfWeek", "", "dayOfWeek", "select", {
    suggest: { related: "dayOfWeek", value: "value", text: "text" },
  });
  col.addTemplateData("opens", "", "Desde", "time");
  col.addTemplateData("closes", "", "Hasta", "time");

  // Related
  col.related = {};
  col.related.dayOfWeek = daysOfWeek;

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();
}

async function postDoctorSchedule(ctx, next) {
  var doctorScheduleData = CJ.parseTemplate(ctx.request.body);

  var doctorScheduleId = await db.createDoctorSchedule(
    ctx.params.doctor,
    doctorScheduleData,
  );
  ctx.status = 201;
  ctx.set(
    "location",
    CJ.getLinkCJFormat("doctorSchedule", {
      doctor: ctx.params.doctor,
    }).href,
  );

  return next();
}

async function deleteDoctorSchedule(ctx, next) {
  await db.deleteDoctorSchedule(ctx.params.doctor, ctx.params.openingHour);

  ctx.status = 200;
  return next();
}

async function putDoctorSchedule(ctx, next) {
  var doctorScheduleData = CJ.parseTemplate(ctx.request.body);

  await db.updateDoctorSchedule(
    ctx.params.doctor,
    ctx.params.openingHour,
    doctorScheduleData,
  );

  ctx.status = 200;
  ctx.set(
    "location",
    CJ.getLinkCJFormat("doctorSchedule", {
      doctor: ctx.params.doctor,
    }).href,
  );

  return next();
}

export {
  getDoctorSchedule,
  postDoctorSchedule,
  deleteDoctorSchedule,
  putDoctorSchedule,
};
