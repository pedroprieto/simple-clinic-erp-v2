import Koa from "koa";
import KoaRouter from "koa-router";
import KoaBody from "koa-body";
import cors from "@koa/cors";
import { routes } from "./utils/routesList.mjs";
import * as doctors from "./resources/doctors.mjs";
import * as patients from "./resources/patients.mjs";
import * as config from "./resources/config.mjs";
import * as medicalProcedures from "./resources/medicalProcedures.mjs";
import * as consultationVoucherTypes from "./resources/consultationVoucherTypes.mjs";
import * as doctorSchedule from "./resources/doctorSchedule.mjs";
import * as patientSignature from "./resources/patientSignature.mjs";
import * as dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

// Timezone para UTC y que no haya problemas con fechas
process.env.TZ = "UTC";

const app = new Koa();
app.use(KoaBody.koaBody());
app.use(cors());

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
