import * as CJ from "../utils/coljson.mjs";
import { routes } from "../utils/routesList.mjs";
import * as db from "../db/db-dynamodb.mjs";
import templateData from "../schemas/doctorSchema.json" assert { type: "json" };

// router.get(
//   router.routesList["doctors"].name,
//   router.routesList["doctors"].href,
//   async (ctx, next) => {
//     var doctors = await Doctor.list();
//     var col = renderCollectionDoctors(ctx, doctors);
//     ctx.body = { collection: col };
//     return next();
//   },
// );

async function getDoctors(ctx, next) {
  try {
    var items = await db.getDoctors();
  } catch (err) {
    console.log("Error", err);
  }

  var col = CJ.createCJ();
  col.setHref("doctors");
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");

  for (let item of items) {
    let itCJ = CJ.createCJItem();
    itCJ.setHref("doctor", { doctor: item.PK });

    // Data
    itCJ.addData("givenName", item.givenName, "Nombre", "text");
    itCJ.addData("familyName", item.familyName, "Apellidos", "text");
    itCJ.addData("taxID", item.taxID, "NIF", "text");
    itCJ.addData("telephone", item.telephone, "Teléfono", "tel");
    itCJ.addData("address", item.address, "Dirección", "text");
    itCJ.addData("email", item.email, "Email", "email");

    // Links
    itCJ.addLink("doctorSchedule", { doctor: item.PK });
    itCJ.addLink("agenda", { doctor: item.PK });
    itCJ.addLink("doctorInvoices", { doctor: item.PK });
    itCJ.addLink("doctorStats", { doctor: item.PK });
    col.addItem(itCJ);
  }

  // Template
  col.template = templateData;
  // col.addTemplateData("givenName", "", "Nombre", "text");
  // col.addTemplateData("familyName", "", "Apellidos", "text");
  // col.addTemplateData("taxID", "", "NIF", "text");
  // col.addTemplateData("telephone", "", "Teléfono", "tel");
  // col.addTemplateData("address", "", "Dirección", "text");
  // col.addTemplateData("email", "", "Email", "email");

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();

  // All log statements are written to CloudWatch
  console.info(
    `response from: ${event.path} statusCode: ${response.statusCode}`,
  );
  return response;
}

export { getDoctors };
