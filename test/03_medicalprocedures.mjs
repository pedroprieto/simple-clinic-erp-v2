import { expect } from "chai";
import * as dotenv from "dotenv";
import { default as axios } from "axios";
import { startServer, stopServer } from "../index.mjs";
import * as CJ from "../utils/coljson.mjs";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

let template = {};
template.addData = function (name, value) {
  this.data = this.data || [];
  this.data.push({ name, value });
};

let clinic1MedicalProcedureURL;
let clinic2MedicalProcedureURL;

describe("Clinic 1 medical procedures test", () => {
  let server;
  before(async () => {
    process.env.groups = "clinic1,admin";
    server = startServer();
    let absUrl = "http://localhost:3000";
    CJ.setAbsURL(absUrl);
  });

  after(() => stopServer(server));

  it("Return medicalProcedure list", async () => {
    let response = await axios.get(
      CJ.getLinkCJFormat("medicalProcedures").href,
    );
    let data = response.data;

    expect(data.collection).to.exist;
    expect(data.collection.items).to.exist;
    expect(data.collection.items[0].data[0].name).to.equal("message");
  });

  it("Create medicalProcedure", async () => {
    let medicalProcedure = Object.create(template);
    medicalProcedure.addData("name", "MedProc1");
    medicalProcedure.addData("duration", "00:30");
    medicalProcedure.addData("price", 30);
    medicalProcedure.addData("vat", 21);
    medicalProcedure.addData("active", true);

    let response = await axios.post(
      CJ.getLinkCJFormat("medicalProcedures").href,
      {
        template: medicalProcedure,
      },
    );
    expect(response.status).to.equal(201);

    response = await axios.get(CJ.getLinkCJFormat("medicalProcedures").href);
    let data = response.data;
    expect(data.collection).to.exist;
    expect(data.collection.items).to.have.length(1);
    expect(data.collection.items[0].data[0].value).to.equal("MedProc1");
    expect(data.collection.items[0].data[1].value).to.equal("00:30");

    // Access medicalProcedure URL
    clinic1MedicalProcedureURL = data.collection.items[0].href;
    response = await axios.get(clinic1MedicalProcedureURL);
    data = response.data;
    expect(data.collection).to.exist;
    expect(data.collection.items).to.have.length(1);
    expect(data.collection.items[0].data[0].value).to.equal("MedProc1");
    expect(data.collection.items[0].data[1].value).to.equal("00:30");
  });

  it("Update medicalProcedure", async () => {
    let medicalProcedure = Object.create(template);

    medicalProcedure.addData("name", "MedProcUpdated");
    medicalProcedure.addData("duration", "00:45");
    medicalProcedure.addData("price", 30);
    medicalProcedure.addData("vat", 21);
    medicalProcedure.addData("active", true);

    let response = await axios.put(clinic1MedicalProcedureURL, {
      template: medicalProcedure,
    });
    expect(response.status).to.equal(200);

    response = await axios.get(clinic1MedicalProcedureURL);
    let data = response.data;
    expect(data.collection).to.exist;
    expect(data.collection.items).to.have.length(1);
    expect(data.collection.items[0].data[0].value).to.equal("MedProcUpdated");
    expect(data.collection.items[0].data[1].value).to.equal("00:45");
  });
});

describe("Clinic 2 medical procedures test", () => {
  let server;
  before(async () => {
    process.env.groups = "clinic2,admin";
    server = startServer();
    let absUrl = "http://localhost:3000";
    CJ.setAbsURL(absUrl);
  });

  after(() => stopServer(server));

  it("Return medicalProcedure list", async () => {
    let response = await axios.get(
      CJ.getLinkCJFormat("medicalProcedures").href,
    );
    let data = response.data;

    expect(data.collection).to.exist;
    expect(data.collection.items).to.exist;
    expect(data.collection.items[0].data[0].name).to.equal("message");
  });

  it("Create medicalProcedure", async () => {
    let medicalProcedure = Object.create(template);
    medicalProcedure.addData("name", "MedProc2");
    medicalProcedure.addData("duration", "00:60");
    medicalProcedure.addData("price", 40);
    medicalProcedure.addData("vat", 21);
    medicalProcedure.addData("active", true);

    let response = await axios.post(
      CJ.getLinkCJFormat("medicalProcedures").href,
      {
        template: medicalProcedure,
      },
    );
    expect(response.status).to.equal(201);

    response = await axios.get(CJ.getLinkCJFormat("medicalProcedures").href);
    let data = response.data;
    expect(data.collection).to.exist;
    expect(data.collection.items).to.have.length(1);
    expect(data.collection.items[0].data[0].value).to.equal("MedProc2");
    expect(data.collection.items[0].data[1].value).to.equal("00:60");

    // Access medicalProcedure URL
    clinic2MedicalProcedureURL = data.collection.items[0].href;
    response = await axios.get(clinic2MedicalProcedureURL);
    data = response.data;
    expect(data.collection).to.exist;
    expect(data.collection.items).to.have.length(1);
    expect(data.collection.items[0].data[0].value).to.equal("MedProc2");
    expect(data.collection.items[0].data[1].value).to.equal("00:60");
  });

  it("No access to medicalProcedures from another clinic", async () => {
    try {
      response = await axios.get(clinic1MedicalProcedureURL);
    } catch (error) {
      expect(error.response.status).to.equal(400);
    }
  });
});
