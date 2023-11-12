import * as CJ from "../utils/coljson.mjs";
import * as db from "../db/db-dynamodb.mjs";
// import templateData from "../schemas/doctorSchema.json" assert { type: "json" };

async function consultationSelectPatient(ctx, next) {
  let fecha = new Date(ctx.query.date);
  var col = CJ.createCJ();
  col.setTitle("Seleccionar paciente para la consulta");

  // Message
  col.message = `Fecha: <b>${fecha.toLocaleString()}</b>`;

  col.setHref("patients");
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");

  let backLink = CJ.getLinkCJFormat("agenda", { doctor: ctx.params.doctor });
  backLink.prompt = "Volver";
  backLink.rel = "collection prev";
  col.links.push(backLink);

  var items = await db.getPatients();

  for (let item of items) {
    let itCJ = CJ.createCJItem();
    itCJ.setHref("patient", { patient: item.PK });
    itCJ.readOnly = true;

    // Data
    itCJ.addData("givenName", item.givenName, "Nombre", "text");
    itCJ.addData("familyName", item.familyName, "Apellidos", "text");
    itCJ.addData("taxID", item.taxID, "NIF", "text");
    itCJ.addData("telephone", item.telephone, "Teléfono", "tel");
    itCJ.addData("email", item.email, "Email", "email");

    // Links
    itCJ.addLink("consultations_select_medProc", {
      date: ctx.query.date,
      doctor: ctx.params.doctor,
      patient: item.PK,
    });
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
  col.addTemplateData(
    "nextStep",
    CJ.getLinkCJFormat("consultations_select_patient", {
      doctor: ctx.params.doctor,
    }).href + `?date=${ctx.query.date}`,
    "Siguiente paso",
    "hidden",
  );

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();
}

async function consultationSelectMedProc(ctx, next) {
  let fecha = new Date(ctx.params.date);
  var col = CJ.createCJ();
  col.setTitle("Seleccionar tipo de consulta");

  // Get patient
  var patient = await db.getPatient(ctx.params.patient);
  if (!patient) {
    let err = new Error("No encontrado");
    err.status = 400;
    throw err;
  }

  // Message
  col.message = `Fecha: <b>${fecha.toLocaleString()}</b><br>Paciente: <b>${
    patient.givenName
  } ${patient.familyName}`;

  col.setHref("medicalProcedures");
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");

  let backLink = CJ.getLinkCJFormat("consultations_select_patient", {
    doctor: ctx.params.doctor,
  });
  backLink.href += `?date=${ctx.params.date}`;
  backLink.prompt = "Volver";
  backLink.rel = "collection prev";
  col.links.push(backLink);

  var items = await db.getMedicalProcedures();

  for (let item of items) {
    let itCJ = CJ.createCJItem();
    itCJ.setHref("medicalProcedure", { medicalprocedure: item.PK });
    itCJ.readOnly = true;

    // Data
    itCJ.addData("name", item.name, "Nombre", "text");
    itCJ.addData("duration", item.duration, "Duración", "time");
    itCJ.addData("price", item.price, "Precio", "number");
    itCJ.addData("vat", item.vat, "IVA (%)", "number");
    itCJ.addData("active", item.active, "Activo", "checkbox");

    // Links
    itCJ.addLink("consultations_create", {
      date: ctx.params.date,
      doctor: ctx.params.doctor,
      patient: ctx.params.patient,
      medicalprocedure: item.PK,
    });
    col.addItem(itCJ);
  }

  // If no items
  if (items.length == 0) {
    let itCJ = CJ.createCJItem();
    itCJ.readOnly = true;
    itCJ.addData(
      "message",
      "No hay tipos de consulta creadas",
      "Mensaje",
      "text",
    );
    col.addItem(itCJ);
  }

  // Template
  // col.template = templateData;
  col.addTemplateData("name", "", "Nombre", "text");
  col.addTemplateData("duration", "", "Duración", "time");
  col.addTemplateData("price", "", "Precio", "number");
  col.addTemplateData("vat", "", "IVA (%)", "number");
  col.addTemplateData("active", "", "Activo", "checkbox");
  col.addTemplateData(
    "nextStep",
    CJ.getLinkCJFormat("consultations_select_medProc", {
      doctor: ctx.params.doctor,
      date: ctx.params.date,
      patient: ctx.params.patient,
    }).href,
    "Siguiente paso",
    "hidden",
  );

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();
}

async function getConsultationCreate(ctx, next) {
  let fecha = new Date(ctx.params.date);
  var col = CJ.createCJ();
  col.setTitle("Crear consulta");
  col.type = "template";

  // Get patient
  var patient = await db.getPatient(ctx.params.patient);
  if (!patient) {
    let err = new Error("No encontrado");
    err.status = 400;
    throw err;
  }

  // Get medical procedure
  var medProc = await db.getMedicalProcedure(ctx.params.medicalprocedure);
  if (!medProc) {
    let err = new Error("No encontrado");
    err.status = 400;
    throw err;
  }

  // Message
  col.message = `Fecha: <b>${fecha.toLocaleString()}</b>
<br>
Paciente: <b>${patient.givenName} ${patient.familyName}</b>
<br>
Tipo de consulta: <b>${medProc.name}</b>`;

  col.setHref("consultations_create", {
    doctor: ctx.params.doctor,
    patient: ctx.params.patient,
    date: ctx.params.date,
    medicalprocedure: ctx.params.medicalprocedure,
  });
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");

  let backLink = CJ.getLinkCJFormat("consultations_select_medProc", {
    doctor: ctx.params.doctor,
    date: ctx.params.date,
    patient: ctx.params.patient,
  });
  backLink.href += `?date=${ctx.params.date}`;
  backLink.prompt = "Volver";
  backLink.rel = "collection prev";
  col.links.push(backLink);

  // Template
  // col.template = templateData;

  col.addTemplateData(
    "confirm",
    `Crear consulta para el paciente <b>${patient.givenName} ${
      patient.familyName
    }</b> con fecha <b>${fecha.toLocaleString()}</b>`,
    "crear consulta",
    "notification",
  );

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();
}

async function postConsultationCreate(ctx, next) {
  var patient = await db.getPatient(ctx.params.patient);
  var doctor = await db.getDoctor(ctx.params.doctor);
  var medProc = await db.getMedicalProcedure(ctx.params.medicalprocedure);

  let data = {
    patientName: `${patient.givenName} ${patient.familyName}`,
    doctorName: `${doctor.givenName} ${doctor.familyName}`,
    medicalProcedureName: `${medProc.name}`,
  };

  var consultationId = await db.createConsultation(
    ctx.params.doctor,
    ctx.params.patient,
    ctx.params.date,
    ctx.params.medicalprocedure,
    data,
  );
  ctx.status = 201;
  ctx.set(
    "location",
    CJ.getLinkCJFormat("consultation", { consultation: consultationId }).href,
  );

  return next();
}

async function getConsultation(ctx, next) {
  var item = await db.getConsultation(ctx.params.consultation);
  if (!item) {
    let err = new Error("No encontrado");
    err.status = 400;
    throw err;
  }

  let dCons = new Date(item.date);

  var col = CJ.createCJ();
  col.setTitle(
    `Consulta del paciente ${item.patientName} ${dCons.toLocaleString()}`,
  );
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");

  let itCJ = CJ.createCJItem();
  itCJ.setHref("consultation", { consultation: item.PK });

  // Data
  itCJ.addData("doctorName", item.doctorName, "Doctor", "text");
  itCJ.addData("patientName", item.patientName, "Paciente", "text");
  itCJ.addData(
    "medicalProcedure",
    item.medicalProcedureName,
    "Tipo de consulta",
    "text",
  );
  itCJ.addData("date", dCons.toLocaleString(), "Fecha", "text");
  itCJ.addData("diagnosis", item.diagnosis, "Diagnóstico", "textarea");
  itCJ.addData(
    "description",
    item.description,
    "Observaciones y tratamiento",
    "textarea",
  );

  // Links
  col.setHref("agenda", { doctor: item.doctorId });
  col.addLink("patient", { patient: item.patientId });
  // col.addLink("invoice", {});

  col.addItem(itCJ);

  // Template
  // col.template = templateData;
  col.addTemplateData("diagnosis", item.diagnosis, "Diagnóstico", "textarea");
  col.addTemplateData(
    "description",
    item.description,
    "Observaciones y tratamiento",
    "textarea",
  );

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();
}

async function putConsultation(ctx, next) {
  var consultationData = CJ.parseTemplate(ctx.request.body);
  var diagnosis = consultationData.diagnosis;
  var description = consultationData.description;

  await db.updateConsultation(ctx.params.consultation, description, diagnosis);

  ctx.status = 200;
  ctx.set(
    "location",
    CJ.getLinkCJFormat("consultation", {
      consultation: ctx.params.consultation,
    }).href,
  );

  return next();
}

async function deleteConsultation(ctx, next) {
  await db.deleteConsultation(ctx.params.consultation);

  ctx.status = 200;
  return next();
}

export {
  consultationSelectPatient,
  consultationSelectMedProc,
  getConsultationCreate,
  postConsultationCreate,
  getConsultation,
  putConsultation,
  deleteConsultation,
};
