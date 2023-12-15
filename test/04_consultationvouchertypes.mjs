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

let clinic1ConsultationVoucherTypeURL;
let clinic2ConsultationVoucherTypeURL;
let medProc1Id;
let medProc2Id;

describe("Clinic 1 consultation voucher types test", () => {
  let server;
  before(async () => {
    process.env.groups = "clinic1,admin";
    server = startServer();
    let absUrl = "http://localhost:3000";
    CJ.setAbsURL(absUrl);
  });

  after(() => stopServer(server));

  it("Return consultationVoucherType list", async () => {
    let response = await axios.get(
      CJ.getLinkCJFormat("consultationVoucherTypes").href,
    );
    let data = response.data;

    expect(data.collection).to.exist;
    expect(data.collection.items).to.exist;
    expect(data.collection.items[0].data[0].name).to.equal("message");
    expect(data.collection.related.medicalProcedureList).to.exist;
    expect(data.collection.related.medicalProcedureList.length).to.equal(1);
    medProc1Id = data.collection.related.medicalProcedureList[0].PK;
  });

  it("Create consultationVoucherType", async () => {
    let consultationVoucherType = Object.create(template);
    consultationVoucherType.addData("name", "ConsVoucherType1");
    consultationVoucherType.addData("medicalProcedure", medProc1Id);
    consultationVoucherType.addData("numberOfConsultations", 10);
    consultationVoucherType.addData("price", 30);
    consultationVoucherType.addData("vat", 21);
    consultationVoucherType.addData("active", true);

    let response = await axios.post(
      CJ.getLinkCJFormat("consultationVoucherTypes").href,
      {
        template: consultationVoucherType,
      },
    );
    expect(response.status).to.equal(201);

    response = await axios.get(
      CJ.getLinkCJFormat("consultationVoucherTypes").href,
    );
    let data = response.data;
    expect(data.collection).to.exist;
    expect(data.collection.items).to.have.length(1);

    // Access consultationVoucherType URL
    clinic1ConsultationVoucherTypeURL = data.collection.items[0].href;
    response = await axios.get(clinic1ConsultationVoucherTypeURL);
    data = response.data;
    expect(data.collection).to.exist;
    expect(data.collection.items).to.have.length(1);
    expect(data.collection.items[0].data[0].value).to.equal("ConsVoucherType1");
    expect(data.collection.items[0].data[1].value).to.equal(medProc1Id);
  });

  it("Update consultationVoucherType", async () => {
    let consultationVoucherType = Object.create(template);

    consultationVoucherType.addData("name", "ConsVoucherType1Updated");
    consultationVoucherType.addData("medicalProcedure", medProc1Id);
    consultationVoucherType.addData("numberOfConsultations", 20);
    consultationVoucherType.addData("price", 30);
    consultationVoucherType.addData("vat", 21);
    consultationVoucherType.addData("active", true);

    let response = await axios.put(clinic1ConsultationVoucherTypeURL, {
      template: consultationVoucherType,
    });
    expect(response.status).to.equal(200);

    response = await axios.get(clinic1ConsultationVoucherTypeURL);
    let data = response.data;
    expect(data.collection).to.exist;
    expect(data.collection.items).to.have.length(1);
    expect(data.collection.items[0].data[0].value).to.equal(
      "ConsVoucherType1Updated",
    );
    expect(data.collection.items[0].data[1].value).to.equal(medProc1Id);
    expect(data.collection.items[0].data[2].value).to.equal(20);
  });
});

describe("Clinic 2 consultation voucher type test", () => {
  let server;
  before(async () => {
    process.env.groups = "clinic2,admin";
    server = startServer();
    let absUrl = "http://localhost:3000";
    CJ.setAbsURL(absUrl);
  });

  after(() => stopServer(server));

  it("Return consultationVoucherType list", async () => {
    let response = await axios.get(
      CJ.getLinkCJFormat("consultationVoucherTypes").href,
    );
    let data = response.data;

    expect(data.collection).to.exist;
    expect(data.collection.items).to.exist;
    expect(data.collection.items[0].data[0].name).to.equal("message");
    expect(data.collection.related.medicalProcedureList).to.exist;
    expect(data.collection.related.medicalProcedureList.length).to.equal(1);
    medProc2Id = data.collection.related.medicalProcedureList[0].PK;
  });

  it("Create consultationVoucherType", async () => {
    let consultationVoucherType = Object.create(template);
    consultationVoucherType.addData("name", "ConsVoucherType2");
    consultationVoucherType.addData("medicalProcedure", medProc2Id);
    consultationVoucherType.addData("numberOfConsultations", 15);
    consultationVoucherType.addData("price", 30);
    consultationVoucherType.addData("vat", 21);
    consultationVoucherType.addData("active", true);

    let response = await axios.post(
      CJ.getLinkCJFormat("consultationVoucherTypes").href,
      {
        template: consultationVoucherType,
      },
    );
    expect(response.status).to.equal(201);

    response = await axios.get(
      CJ.getLinkCJFormat("consultationVoucherTypes").href,
    );
    let data = response.data;
    expect(data.collection).to.exist;
    expect(data.collection.items).to.have.length(1);
    expect(data.collection.items[0].data[0].value).to.equal("ConsVoucherType2");
    expect(data.collection.items[0].data[1].value).to.equal(medProc2Id);

    // Access consultationVoucherType URL
    clinic2ConsultationVoucherTypeURL = data.collection.items[0].href;
    response = await axios.get(clinic2ConsultationVoucherTypeURL);
    data = response.data;
    expect(data.collection).to.exist;
    expect(data.collection.items).to.have.length(1);
    expect(data.collection.items[0].data[0].value).to.equal("ConsVoucherType2");
    expect(data.collection.items[0].data[1].value).to.equal(medProc2Id);
  });

  it("No access to consultationVoucherTypes from another clinic", async () => {
    try {
      response = await axios.get(clinic1ConsultationVoucherTypeURL);
    } catch (error) {
      expect(error.response.status).to.equal(400);
    }
  });
});
