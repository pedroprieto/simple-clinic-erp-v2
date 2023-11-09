import Koa from "koa";
import KoaRouter from "koa-router";
import KoaBody from "koa-body";
import cors from "@koa/cors";
import { routes } from "./utils/routesList.mjs";
import * as doctors from "./resources/doctors.mjs";
import * as dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

// Timezone para UTC y que no haya problemas con fechas
process.env.TZ = "UTC";
console.log(process.env.tableName);

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
