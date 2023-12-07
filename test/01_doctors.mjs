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

let clinic1DoctorURL;
let clinic2DoctorURL;

describe("Clinic 1 doctor test", () => {
  let server;
  before(async () => {
    process.env.groups = "clinic1,admin";
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
    let doctor = Object.create(template);
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

    // Access doctor URL
    clinic1DoctorURL = data.collection.items[0].href;
    response = await axios.get(clinic1DoctorURL);
    data = response.data;
    expect(data.collection).to.exist;
    expect(data.collection.items).to.have.length(1);
    expect(data.collection.items[0].data[0].value).to.equal("DocGivenName");
  });

  it("Update doctor", async () => {
    let doctor = Object.create(template);
    doctor.addData("givenName", "DocGivenNameUpdated");
    doctor.addData("familyName", "DocFamilyNameUpdated");
    doctor.addData("taxID", "DocTaxId1");
    doctor.addData("telephone", "DocTel");
    doctor.addData("address", "DocAddress");
    doctor.addData("email", "DocEmail");

    let response = await axios.put(clinic1DoctorURL, {
      template: doctor,
    });
    expect(response.status).to.equal(200);

    response = await axios.get(clinic1DoctorURL);
    let data = response.data;
    expect(data.collection).to.exist;
    expect(data.collection.items).to.have.length(1);
    expect(data.collection.items[0].data[0].value).to.equal(
      "DocGivenNameUpdated",
    );
    expect(data.collection.items[0].data[1].value).to.equal(
      "DocFamilyNameUpdated",
    );
  });
});

describe("Clinic 2 doctor test", () => {
  let server;
  before(async () => {
    process.env.groups = "clinic2,admin";
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
    let doctor = Object.create(template);
    doctor.addData("givenName", "DocGivenName2");
    doctor.addData("familyName", "DocFamilyName2");
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

    // Access doctor URL
    clinic2DoctorURL = data.collection.items[0].href;
    response = await axios.get(clinic2DoctorURL);
    data = response.data;
    expect(data.collection).to.exist;
    expect(data.collection.items).to.have.length(1);
    expect(data.collection.items[0].data[0].value).to.equal("DocGivenName2");
  });

  it("No access to doctors from another clinic", async () => {
    try {
      response = await axios.get(clinic1DoctorURL);
    } catch (error) {
      expect(error.response.status).to.equal(400);
    }
  });
});
