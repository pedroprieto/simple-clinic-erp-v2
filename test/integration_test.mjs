import { expect } from "chai";
import * as dotenv from "dotenv";
import { default as axios } from "axios";
import { startServer, stopServer } from "../index.mjs";
import * as CJ from "../utils/coljson.mjs";
import * as db from "../db/db-dynamodb.mjs";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

let template = {};
template.addData = function (name, value) {
  this.data = this.data || [];
  this.data.push({ name, value });
};

describe("Integration test", () => {
  let server;
  before(async () => {
    await db.clearTable();
    server = startServer();
    let absUrl = "http://localhost:3000";
    CJ.setAbsURL(absUrl);
  });

  after(() => stopServer(server));

  it("Return doctor list", async () => {
    let response = await axios.get(CJ.getLinkCJFormat("doctors").href);
    let data = response.data;

    expect(data.collection).to.exist;
    expect(data.collection.items).to.not.exist;
  });

  it("Create doctor", async () => {
    console.log(template);
    let doctor = Object.create(template);
    console.log(doctor);
    doctor.addData("givenName", "DocGivenName");
    doctor.addData("familyName", "DocFamilyName");
    doctor.addData("taxID", "DocTaxId1");
    doctor.addData("telephone", "DocTel");
    doctor.addData("address", "DocAddress");
    doctor.addData("email", "DocEmail");

    let response = await axios.post(CJ.getLinkCJFormat("doctors").href, {
      template: doctor,
    });
    expect(response.status).to.equal(201);

    response = await axios.get(CJ.getLinkCJFormat("doctors").href);
    let data = response.data;
    expect(data.collection).to.exist;
    expect(data.collection.items).to.have.length(1);
  });
});
