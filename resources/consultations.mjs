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

  var items = await db.getPatients(ctx.state.clinic);

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
  var patient = await db.getPatient(ctx.state.clinic, ctx.params.patient);
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

  var items = await db.getMedicalProcedures(ctx.state.clinic);

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
  var patient = await db.getPatient(ctx.state.clinic, ctx.params.patient);
  if (!patient) {
    let err = new Error("No encontrado");
    err.status = 400;
    throw err;
  }

  // Get medical procedure
  var medProc = await db.getMedicalProcedure(
    ctx.state.clinic,
    ctx.params.medicalprocedure,
  );
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
  var patient = await db.getPatient(ctx.state.clinic, ctx.params.patient);
  var doctor = await db.getDoctor(ctx.state.clinic, ctx.params.doctor);
  var medProc = await db.getMedicalProcedure(
    ctx.state.clinic,
    ctx.params.medicalprocedure,
  );

  let consDate = new Date(ctx.params.date);
  let [duration_hours, duration_minutes] = medProc.duration.split(":");

  let data = {
    patientName: `${patient.givenName} ${patient.familyName}`,
    doctorName: `${doctor.givenName} ${doctor.familyName}`,
    medicalProcedureName: medProc.name,
    start: ctx.params.date,
    end: new Date(
      consDate.getTime() + duration_minutes * 60000 + duration_hours * 1000,
    ).toISOString(),
  };

  var consultationId = await db.createConsultation(
    ctx.state.clinic,
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
  var item = await db.getConsultation(
    ctx.state.clinic,
    ctx.params.consultation,
  );
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

  if (item.invoiceId || item.voucherId) itCJ.readOnly = true;

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

  // Read only
  if (item.invoiceId || item.voucherId) itCJ.readOnly = true;

  // Links
  itCJ.addLink("agenda", { doctor: item.doctorId });
  itCJ.addLink("patient", { patient: item.patientId });

  if (!item.invoiceId && !item.voucherId) {
    itCJ.addLink("consultationAssignInvoice", {
      consultation: ctx.params.consultation,
    });
    itCJ.addLink("consultationAssignVoucher", {
      consultation: ctx.params.consultation,
    });
  }
  if (item.voucherId) {
    itCJ.addLink("patientVoucher", {
      patient: item.patientId,
      patientVoucher: item.voucherId,
    });
    itCJ.addLink("consultationDeleteVoucher", {
      consultation: ctx.params.consultation,
    });
  }
  if (item.invoiceId) {
    itCJ.addLink("invoice", {
      invoice: item.invoiceId,
    });
  }

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
  await db.deleteConsultation(ctx.state.clinic, ctx.params.consultation);

  ctx.status = 200;
  return next();
}

async function getConsultationAssignVoucher(ctx, next) {
  var item = await db.getConsultation(
    ctx.state.clinic,
    ctx.params.consultation,
  );
  if (!item) {
    let err = new Error("No encontrado");
    err.status = 400;
    throw err;
  }

  var availableVouchers = await db.getAvailablePatientVouchers(item.patientId);

  var col = CJ.createCJ();
  col.setTitle("Asignar consulta a bono");

  col.setHref("consultationAssignVoucher", {
    consultation: ctx.params.consultation,
  });
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");

  // If no items
  if (availableVouchers.length == 0) {
    let itCJ = CJ.createCJItem();
    itCJ.readOnly = true;
    itCJ.addData(
      "message",
      "El paciente no tiene bonos activos.",
      "Mensaje",
      "text",
    );
    col.addItem(itCJ);
  } else {
    col.type = "template";

    // Template
    col.addTemplateData("patientVoucherId", "", "Bono", "select", {
      required: true,
      suggest: { related: "availableVouchers", value: "id", text: "name" },
    });
    col.addTemplateData("patientId", item.patientId, "Paciente", "hidden");
    col.addTemplateData("doctorId", item.doctorId, "Médico", "hidden");
    col.template.type = "post-only";

    // Related
    col.related = {};

    col.related.availableVouchers = availableVouchers.map((el) => {
      return {
        id: el.PK,
        name: el.name,
      };
    });
  }

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();
}

async function postConsultationAssignVoucher(ctx, next) {
  var data = CJ.parseTemplate(ctx.request.body);
  let patientId = data.patientId;
  let doctorId = data.doctorId;
  let patientVoucherId = data.patientVoucherId;
  let consultationId = ctx.params.consultation;

  let patientVoucher = await db.getPatientVoucherById(
    patientId,
    patientVoucherId,
  );

  if (patientVoucher.remainingConsultations == 0) {
    let err = new Error("El bono no tiene consultas disponibles");
    err.status = 400;
    throw err;
  }

  let remainingConsultations = patientVoucher.remainingConsultations - 1;

  await db.assignPatientVoucherToConsultation(
    ctx.state.clinic,
    consultationId,
    patientVoucherId,
    patientId,
    doctorId,
    remainingConsultations,
  );

  ctx.status = 201;
  ctx.set(
    "location",
    CJ.getLinkCJFormat("consultation", {
      consultation: ctx.params.consultation,
    }).href,
  );

  return next();
}

async function getConsultationDeleteVoucher(ctx, next) {
  var item = await db.getConsultation(
    ctx.state.clinic,
    ctx.params.consultation,
  );
  if (!item) {
    let err = new Error("No encontrado");
    err.status = 400;
    throw err;
  }

  var col = CJ.createCJ();
  col.setTitle("Eliminar consulta de bono");

  col.setHref("consultationDeleteVoucher", {
    consultation: ctx.params.consultation,
  });
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");

  col.type = "template";

  // Template
  col.addTemplateData(
    "confirm",
    "Eliminar la consulta asociada al bono",
    "crear consulta",
    "notification",
  );

  col.addTemplateData("patientVoucherId", item.voucherId, "Bono", "hidden");
  col.addTemplateData("patientId", item.patientId, "Paciente", "hidden");
  col.addTemplateData("doctorId", item.doctorId, "Médico", "hidden");
  col.template.type = "post-only";

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();
}

async function postConsultationDeleteVoucher(ctx, next) {
  var data = CJ.parseTemplate(ctx.request.body);
  let patientId = data.patientId;
  let doctorId = data.doctorId;
  let patientVoucherId = data.patientVoucherId;
  let consultationId = ctx.params.consultation;

  let patientVoucher = await db.getPatientVoucherById(
    patientId,
    patientVoucherId,
  );

  let remainingConsultations = patientVoucher.remainingConsultations + 1;

  await db.deletePatientVoucherFromConsultation(
    ctx.state.clinic,
    consultationId,
    patientVoucherId,
    patientId,
    doctorId,
    remainingConsultations,
  );

  ctx.status = 201;
  ctx.set(
    "location",
    CJ.getLinkCJFormat("consultation", {
      consultation: ctx.params.consultation,
    }).href,
  );

  return next();
}

async function consultationAssignInvoice(ctx, next) {
  var item = await db.getConsultation(
    ctx.state.clinic,
    ctx.params.consultation,
  );
  if (!item) {
    let err = new Error("No encontrado");
    err.status = 400;
    throw err;
  }
  var medProc = await db.getMedicalProcedure(
    ctx.state.clinic,
    item.medicalProcedure,
  );
  if (!medProc) {
    let err = new Error("No encontrado");
    err.status = 400;
    throw err;
  }
  let doctors = await db.getDoctors(ctx.state.clinic);

  var col = CJ.createCJ();
  col.type = "template";
  col.setTitle(
    `Facturar consulta de ${item.patientName} con fecha ${new Date(
      item.date,
    ).toLocaleString()}`,
  );

  col.setHref("consultationAssignInvoice", {
    consultation: ctx.params.consultation,
  });
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");

  // Template
  // col.template = templateData;
  col.addTemplateData(
    "date",
    new Date().toISOString().substring(0, 10),
    "Fecha de factura",
    "date",
  );
  col.addTemplateData(
    "price",
    medProc.price,
    "Precio final (con IVA)",
    "number",
    {
      step: "0.01",
    },
  );
  col.addTemplateData("vat", medProc.vat, "IVA (%)", "number");
  col.addTemplateData("incomeTax", 0, "Retención IRPF (%)", "number");
  // col.addTemplateData("seller", item.doctorId, "Médico que factura", "select", {
  col.addTemplateData("seller", "", "Médico que factura", "select", {
    required: true,
    suggest: { related: "doctorList", value: "id", text: "fullName" },
  });

  col.related = {};
  col.related.doctorList = doctors.map((d) => {
    return { id: d.PK, fullName: `${d.givenName} ${d.familyName}` };
  });

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();
}

async function postInvoice(ctx, next) {
  var invoiceData = CJ.parseTemplate(ctx.request.body);
  let patientId;
  let cons_vouch_id;
  if (ctx.params.consultation) {
    let consultation = await db.getConsultation(
      ctx.state.clinic,
      ctx.params.consultation,
    );
    patientId = consultation.patientId;
    cons_vouch_id = ctx.params.consultation;
  } else if (ctx.params.patientVoucher) {
    patientId = ctx.params.patient;
    cons_vouch_id = ctx.params.patientVoucher;
  }
  var doctor = await db.getDoctor(ctx.state.clinic, invoiceData.seller);
  var patient = await db.getPatient(ctx.state.clinic, patientId);
  // seller is doctorId

  let invoice = {};
  invoice.date = invoiceData.date;
  invoice.seller = {};
  invoice.seller.fullName = `${doctor.givenName} ${doctor.familyName}`;
  invoice.seller.taxID = doctor.taxID;
  invoice.seller.address = doctor.address;
  invoice.seller.email = doctor.email;
  invoice.seller.telephone = doctor.telephone;
  invoice.customerName = `${patient.givenName} ${patient.familyName}`;
  invoice.customer = {};
  invoice.customer.address = patient.address;
  invoice.customer.taxID = patient.taxID;
  invoice.dateLocalized = new Date().toLocaleDateString();
  invoice.incomeTax = invoiceData.incomeTax;

  // Invoice number
  let invYear = new Date(invoice.date).getFullYear();
  let curInvNumber;
  try {
    let el = await db.getCurrentInvNumber(invoiceData.seller, invYear);
    curInvNumber = el.invoiceNumber;
  } catch (e) {
    curInvNumber = 0;
  }
  let newInvoiceNumber = curInvNumber + 1;
  invoice.invoiceNumber =
    invYear + "-" + String(newInvoiceNumber).padStart(6, "0");

  invoice.patientId = patient.PK;
  invoice.doctorId = doctor.PK;
  invoice.orderItems = [];
  invoice.orderItems.push({
    kind: "Consultation",
    price: invoiceData.price,
    netPrice:
      Math.round((invoiceData.price / (1 + invoiceData.vat / 100)) * 100) / 100,
    tax: invoiceData.vat,
    taxPrice:
      Math.round(
        (invoiceData.vat * invoiceData.price) / (1 + invoiceData.vat / 100),
      ) / 100,
    // TODO
    description: "Consulta", //medicalprocedure.name
    item: cons_vouch_id,
  });

  invoice.netTotal = invoice.orderItems.reduce(function (res, el) {
    return res + el.netPrice;
  }, 0);
  invoice.taxTotal = invoice.orderItems.reduce(function (res, el) {
    return res + el.taxPrice;
  }, 0);
  invoice.incomeTaxTotal =
    Math.round(invoice.netTotal * invoice.incomeTax) / 100;

  invoice.amountDue =
    invoice.orderItems.reduce(function (res, el) {
      return res + el.price;
    }, 0) - invoice.incomeTaxTotal;

  invoice.subTotals = invoice.orderItems.reduce(function (res, el) {
    if (res[el.tax]) {
      res[el.tax].price += el.netPrice;
      res[el.tax].tax += el.taxPrice;
    } else {
      res[el.tax] = {};
      res[el.tax].price = el.netPrice;
      res[el.tax].tax = el.taxPrice;
    }
    if (el.tax == 0) {
      res[el.tax].isZero = true;
    }
    return res;
  }, {});

  if (ctx.params.consultation) {
    await db.createInvoiceForConsultation(
      ctx.state.clinic,
      cons_vouch_id,
      invoice,
      curInvNumber,
      newInvoiceNumber,
      invYear,
    );
    ctx.set(
      "location",
      CJ.getLinkCJFormat("consultation", {
        consultation: ctx.params.consultation,
      }).href,
    );
  } else {
    await db.createInvoiceForVoucher(
      ctx.state.clinic,
      cons_vouch_id,
      invoice,
      curInvNumber,
      newInvoiceNumber,
      invYear,
    );
    ctx.set(
      "location",
      CJ.getLinkCJFormat("patientVoucher", {
        patientVoucher: ctx.params.patientVoucher,
        patient: ctx.params.patient,
      }).href,
    );
  }
  ctx.status = 201;

  return next();
}

async function voucherAssignInvoice(ctx, next) {
  var item = await db.getPatientVoucherById(
    ctx.params.patient,
    ctx.params.patientVoucher,
  );
  if (!item) {
    let err = new Error("No encontrado");
    err.status = 400;
    throw err;
  }
  if (item.invoiceId) {
    let err = new Error(
      "El bono tiene factura asociada. No se puede crear la factura.",
    );
    err.status = 400;
    throw err;
  }
  let doctors = await db.getDoctors(ctx.state.clinic);

  var col = CJ.createCJ();
  col.type = "template";
  col.setTitle(`Facturar bono de ${item.patientName}`);

  col.setHref("voucherAssignInvoice", {
    patientVoucher: ctx.params.patientVoucher,
    patient: ctx.params.patient,
  });
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");

  // Template
  // col.template = templateData;
  col.addTemplateData(
    "date",
    new Date().toISOString().substring(0, 10),
    "Fecha de factura",
    "date",
  );
  col.addTemplateData("price", item.price, "Precio final (con IVA)", "number", {
    step: "0.01",
  });
  col.addTemplateData("vat", item.vat, "IVA (%)", "number");
  col.addTemplateData("incomeTax", 0, "Retención IRPF (%)", "number");
  // col.addTemplateData("seller", item.doctorId, "Médico que factura", "select", {
  col.addTemplateData("seller", "", "Médico que factura", "select", {
    required: true,
    suggest: { related: "doctorList", value: "id", text: "fullName" },
  });

  col.related = {};
  col.related.doctorList = doctors.map((d) => {
    return { id: d.PK, fullName: `${d.givenName} ${d.familyName}` };
  });

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();
}

async function getPatientConsultations(ctx, next) {
  var consultations = await db.getConsultationsById(ctx.params.patient);

  var col = CJ.createCJ();
  col.setTitle("Consultas del paciente");
  col.setHref("patientConsultations", { patient: ctx.params.patient });
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");

  col.addLink("patient", { patient: ctx.params.patient });
  col.addLink("patientVouchers", { patient: ctx.params.patient });
  col.addLink("patientConsultations", { patient: ctx.params.patient });
  col.addLink("patientInvoices", { patient: ctx.params.patient });
  col.addLink("patientAttachments", { patient: ctx.params.patient });
  col.addLink("patientSignature", { patient: ctx.params.patient });

  var cons_items = consultations.forEach((item) => {
    let itCJ = CJ.createCJItem();
    itCJ.setHref("consultation", { consultation: item.PK });

    if (item.invoiceId || item.voucherId) itCJ.readOnly = true;

    // Data
    itCJ.addData("doctorName", item.doctorName, "Doctor", "text");
    itCJ.addData("patientName", item.patientName, "Paciente", "text");
    itCJ.addData(
      "medicalProcedure",
      item.medicalProcedureName,
      "Tipo de consulta",
      "text",
    );

    let dCons = new Date(item.date);
    itCJ.addData("date", dCons.toLocaleString(), "Fecha", "text");
    itCJ.addData("diagnosis", item.diagnosis, "Diagnóstico", "textarea");
    itCJ.addData(
      "description",
      item.description,
      "Observaciones y tratamiento",
      "textarea",
    );

    // Read only
    if (item.invoiceId || item.voucherId) itCJ.readOnly = true;

    // Links
    // itCJ.addLink("agenda", { doctor: item.doctorId });
    // itCJ.addLink("patient", { patient: item.patientId });

    if (!item.invoiceId && !item.voucherId) {
      itCJ.addLink("consultationAssignInvoice", {
        consultation: item.PK,
      });
      itCJ.addLink("consultationAssignVoucher", {
        consultation: item.PK,
      });
    }
    if (item.voucherId) {
      itCJ.addLink("patientVoucher", {
        patient: item.patient,
        patientVoucher: item.voucherId,
      });
      itCJ.addLink("consultationDeleteVoucher", {
        consultation: item.PK,
      });
    }
    if (item.invoiceId) {
      itCJ.addLink("invoice", {
        invoice: item.invoiceId,
      });
    }

    col.addItem(itCJ);
  });

  ctx.status = 200;
  ctx.body = { collection: col };
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
  consultationAssignInvoice,
  postInvoice,
  getPatientConsultations,
  getConsultationAssignVoucher,
  postConsultationAssignVoucher,
  postConsultationDeleteVoucher,
  getConsultationDeleteVoucher,
  voucherAssignInvoice,
};
