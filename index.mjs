import Koa from "koa";
import KoaRouter from "koa-router";
import KoaBody from "koa-body";
import KoaViews from "koa-views";
import cors from "@koa/cors";
import { routes } from "./utils/routesList.mjs";
import * as doctors from "./resources/doctors.mjs";
import * as patients from "./resources/patients.mjs";
import * as config from "./resources/config.mjs";
import * as medicalProcedures from "./resources/medicalProcedures.mjs";
import * as consultationVoucherTypes from "./resources/consultationVoucherTypes.mjs";
import * as doctorSchedule from "./resources/doctorSchedule.mjs";
import * as patientSignature from "./resources/patientSignature.mjs";
import * as agenda from "./resources/agenda.mjs";
import * as consultations from "./resources/consultations.mjs";
import * as patientVouchers from "./resources/patientVouchers.mjs";
import * as invoices from "./resources/invoices.mjs";
import * as patientAttachments from "./resources/patientAttachments.mjs";
import * as dotenv from "dotenv";
import "./utils/date.mjs";
import * as CJ from "./utils/coljson.mjs";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
import { getCurrentInvoke } from "@vendia/serverless-express";

// Timezone para UTC y que no haya problemas con fechas
process.env.TZ = "UTC";

const app = new Koa();
app.use(KoaBody.koaBody({ multipart: true }));
app.use(cors());

app.use(
  KoaViews("./views", {
    map: {
      html: "handlebars",
    },
  }),
);

var router = new KoaRouter();

// Error processing
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    // Show info if error is not 500
    // if (err.expose) {
    if (true) {
      ctx.body = {};
      ctx.body.message = err.message || "Error interno";
      console.log(err);
    }
    // ctx.app.emit('error', err, ctx);
  }
});

app.use((ctx, next) => {
  let absUrl = ctx.protocol + "://" + ctx.request.host;
  if (process.env.stage) absUrl += `/${process.env.stage}`;

  CJ.setAbsURL(absUrl);
  return next();
});

// Auth info from API Gateway
app.use((ctx, next) => {
  console.log("test");
  ctx.state.isAdmin = false;
  ctx.state.groups = [];
  if (process.env.NODE_ENV == "local") {
    ctx.state.userId = process.env.userId;
    if (process.env.groups) ctx.state.groups = process.env.groups.split(",");
  } else {
    const { event } = getCurrentInvoke();
    ctx.state.userId = event.requestContext.authorizer.principalId;
    if (event.requestContext.authorizer.groups)
      ctx.state.groups = event.requestContext.authorizer.groups.split(",");
  }
  if (ctx.state.groups.includes("admin")) ctx.state.isAdmin = true;

  return next();
});

// Resources
router.get(routes.doctors.name, routes.doctors.href, doctors.getDoctors);
router.post(routes.doctors.name, routes.doctors.href, doctors.postDoctor);
router.get(routes.doctor.name, routes.doctor.href, doctors.getDoctor);
router.delete(routes.doctor.name, routes.doctor.href, doctors.deleteDoctor);
router.put(routes.doctor.name, routes.doctor.href, doctors.putDoctor);

router.get(routes.patients.name, routes.patients.href, patients.getPatients);
router.post(routes.patients.name, routes.patients.href, patients.postPatient);
router.get(routes.patient.name, routes.patient.href, patients.getPatient);
router.delete(routes.patient.name, routes.patient.href, patients.deletePatient);
router.put(routes.patient.name, routes.patient.href, patients.putPatient);

router.get(
  routes.medicalProcedures.name,
  routes.medicalProcedures.href,
  medicalProcedures.getMedicalProcedures,
);
router.post(
  routes.medicalProcedures.name,
  routes.medicalProcedures.href,
  medicalProcedures.postMedicalProcedure,
);
router.get(
  routes.medicalProcedure.name,
  routes.medicalProcedure.href,
  medicalProcedures.getMedicalProcedure,
);
router.delete(
  routes.medicalProcedure.name,
  routes.medicalProcedure.href,
  medicalProcedures.deleteMedicalProcedure,
);
router.put(
  routes.medicalProcedure.name,
  routes.medicalProcedure.href,
  medicalProcedures.putMedicalProcedure,
);

router.get(
  routes.consultationVoucherTypes.name,
  routes.consultationVoucherTypes.href,
  consultationVoucherTypes.getConsultationVoucherTypes,
);
router.post(
  routes.consultationVoucherTypes.name,
  routes.consultationVoucherTypes.href,
  consultationVoucherTypes.postConsultationVoucherType,
);
router.get(
  routes.consultationVoucherType.name,
  routes.consultationVoucherType.href,
  consultationVoucherTypes.getConsultationVoucherType,
);
router.delete(
  routes.consultationVoucherType.name,
  routes.consultationVoucherType.href,
  consultationVoucherTypes.deleteConsultationVoucherType,
);
router.put(
  routes.consultationVoucherType.name,
  routes.consultationVoucherType.href,
  consultationVoucherTypes.putConsultationVoucherType,
);

router.get(routes.config.name, routes.config.href, config.getConfig);

router.get(
  routes.doctorSchedule.name,
  routes.doctorSchedule.href,
  doctorSchedule.getDoctorSchedule,
);
router.post(
  routes.doctorSchedule.name,
  routes.doctorSchedule.href,
  doctorSchedule.postDoctorSchedule,
);
router.put(
  routes.doctorScheduleOpeningHour.name,
  routes.doctorScheduleOpeningHour.href,
  doctorSchedule.putDoctorSchedule,
);
router.delete(
  routes.doctorScheduleOpeningHour.name,
  routes.doctorScheduleOpeningHour.href,
  doctorSchedule.deleteDoctorSchedule,
);

router.get(
  routes.patientSignature.name,
  routes.patientSignature.href,
  patientSignature.getPatientSignature,
);
router.post(
  routes.patientSignature.name,
  routes.patientSignature.href,
  patientSignature.postPatientSignature,
);

router.get(routes.agenda.name, routes.agenda.href, agenda.getDoctorAgenda);

router.get(
  routes.consultations_select_patient.name,
  routes.consultations_select_patient.href,
  consultations.consultationSelectPatient,
);
router.get(
  routes.consultations_select_medProc.name,
  routes.consultations_select_medProc.href,
  consultations.consultationSelectMedProc,
);
router.get(
  routes.consultations_create.name,
  routes.consultations_create.href,
  consultations.getConsultationCreate,
);
router.post(
  routes.consultations_create.name,
  routes.consultations_create.href,
  consultations.postConsultationCreate,
);
router.get(
  routes.consultation.name,
  routes.consultation.href,
  consultations.getConsultation,
);
router.put(
  routes.consultation.name,
  routes.consultation.href,
  consultations.putConsultation,
);
router.delete(
  routes.consultation.name,
  routes.consultation.href,
  consultations.deleteConsultation,
);
router.get(
  routes.consultationAssignInvoice.name,
  routes.consultationAssignInvoice.href,
  consultations.consultationAssignInvoice,
);
router.post(
  routes.consultationAssignInvoice.name,
  routes.consultationAssignInvoice.href,
  consultations.postInvoice,
);
router.get(
  routes.patientConsultations.name,
  routes.patientConsultations.href,
  consultations.getPatientConsultations,
);
router.get(
  routes.patientVouchers.name,
  routes.patientVouchers.href,
  patientVouchers.getPatientVouchers,
);
router.post(
  routes.patientVouchers.name,
  routes.patientVouchers.href,
  patientVouchers.postPatientVoucher,
);
router.delete(
  routes.patientVoucher.name,
  routes.patientVoucher.href,
  patientVouchers.deletePatientVoucher,
);
router.get(
  routes.consultationAssignVoucher.name,
  routes.consultationAssignVoucher.href,
  consultations.getConsultationAssignVoucher,
);
router.post(
  routes.consultationAssignVoucher.name,
  routes.consultationAssignVoucher.href,
  consultations.postConsultationAssignVoucher,
);
router.get(
  routes.consultationDeleteVoucher.name,
  routes.consultationDeleteVoucher.href,
  consultations.getConsultationDeleteVoucher,
);
router.post(
  routes.consultationDeleteVoucher.name,
  routes.consultationDeleteVoucher.href,
  consultations.postConsultationDeleteVoucher,
);
router.get(
  routes.patientInvoices.name,
  routes.patientInvoices.href,
  invoices.getPatientInvoices,
);
router.get(
  routes.doctorInvoices.name,
  routes.doctorInvoices.href,
  invoices.getDoctorInvoices,
);
router.get(
  routes.invoiceHTML.name,
  routes.invoiceHTML.href,
  invoices.getInvoiceHTML,
);
router.get(
  routes.voucherAssignInvoice.name,
  routes.voucherAssignInvoice.href,
  consultations.voucherAssignInvoice,
);
router.post(
  routes.voucherAssignInvoice.name,
  routes.voucherAssignInvoice.href,
  consultations.postInvoice,
);
router.get(
  routes.patientAttachments.name,
  routes.patientAttachments.href,
  patientAttachments.getPatientAttachments,
);
router.get(
  routes.patientAttachmentFile.name,
  routes.patientAttachmentFile.href,
  patientAttachments.getPatientAttachmentFile,
);
router.post(
  routes.patientAttachments.name,
  routes.patientAttachments.href,
  patientAttachments.postPatientAttachment,
);
router.delete(
  routes.patientAttachment.name,
  routes.patientAttachment.href,
  patientAttachments.deletePatientAttachment,
);

app.use(router.routes()).use(router.allowedMethods());

function startServer() {
  return app.listen(3000);
}

function stopServer(server) {
  return new Promise((resolve) => {
    server.close(() => {
      resolve();
    });
  });
}

// export app for testing
export { app, router, startServer, stopServer };
