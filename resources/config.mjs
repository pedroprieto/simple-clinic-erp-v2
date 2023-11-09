import * as CJ from "../utils/coljson.mjs";

async function getConfig(ctx, next) {
  var col = CJ.createCJ();
  col.setTitle("Configuración");
  col.setHref("config");
  col.addLink("patients");
  col.addLink("doctors");
  col.addLink("config");
  col.addLink("medicalProcedures");
  col.addLink("consultationVoucherTypes");

  ctx.status = 200;
  ctx.body = { collection: col };
  return next();
}

export { getConfig };
