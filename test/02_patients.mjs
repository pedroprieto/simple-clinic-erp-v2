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

let clinic1Patient1URL;
let clinic1Patient2URL;
let clinic2PatientURL;

describe("Clinic 1 patient test", () => {
  let server;
  before(async () => {
    process.env.groups = "clinic1,admin";
    server = startServer();
    let absUrl = "http://localhost:3000";
    CJ.setAbsURL(absUrl);
  });

  after(() => stopServer(server));

  it("Return patient list", async () => {
    let response = await axios.get(CJ.getLinkCJFormat("patients").href);
    let data = response.data;

    expect(data.collection).to.exist;
    expect(data.collection.items).to.exist;
    expect(data.collection.items[0].data[0].name).to.equal("message");
  });

  it("Create patients", async () => {
    let patient = Object.create(template);
    patient.addData("givenName", "PatientGivenName");
    patient.addData("familyName", "PatientFamilyName");
    patient.addData("taxID", "PatientTaxId1");
    patient.addData("telephone", "PatientTel");
    patient.addData("address", "PatientAddress");
    patient.addData("email", "PatientEmail");
    patient.addData("birthDate", "2023-02-02");

    // Create 2 patients
    let response = await axios.post(CJ.getLinkCJFormat("patients").href, {
      template: patient,
    });
    expect(response.status).to.equal(201);
    clinic1Patient1URL = response.headers.location;

    let patient2 = Object.create(template);
    patient2.addData("givenName", "PatientGivenName2");
    patient2.addData("familyName", "PatientFamilyName2");
    patient2.addData("taxID", "PatientTaxId2");
    patient2.addData("telephone", "PatientTel2");
    patient2.addData("address", "PatientAddress2");
    patient.addData("email", "PatientEmail2");
    patient2.addData("birthDate", "2023-02-02");
    response = await axios.post(CJ.getLinkCJFormat("patients").href, {
      template: patient2,
    });
    expect(response.status).to.equal(201);
    clinic1Patient2URL = response.headers.location;

    response = await axios.get(CJ.getLinkCJFormat("patients").href);
    let data = response.data;
    expect(data.collection).to.exist;
    expect(data.collection.items).to.have.length(2);

    // Access patient 1 URL
    response = await axios.get(clinic1Patient1URL);
    data = response.data;
    expect(data.collection).to.exist;
    expect(data.collection.items).to.have.length(1);
    expect(data.collection.items[0].data[0].value).to.equal("PatientGivenName");

    // Access patient 2 URL
    response = await axios.get(clinic1Patient2URL);
    data = response.data;
    expect(data.collection).to.exist;
    expect(data.collection.items).to.have.length(1);
    expect(data.collection.items[0].data[0].value).to.equal(
      "PatientGivenName2",
    );
  });

  it("Update patient", async () => {
    let patient = Object.create(template);
    patient.addData("givenName", "PatientGivenNameUpdated");
    patient.addData("familyName", "PatientFamilyNameUpdated");
    patient.addData("taxID", "PatientTaxId1");
    patient.addData("telephone", "PatientTel");
    patient.addData("address", "PatientAddress");
    patient.addData("email", "PatientEmail");
    patient.addData("birthDate", "2023-02-02");

    let response = await axios.put(clinic1Patient1URL, {
      template: patient,
    });
    expect(response.status).to.equal(200);

    response = await axios.get(clinic1Patient1URL);
    let data = response.data;
    expect(data.collection).to.exist;
    expect(data.collection.items).to.have.length(1);
    expect(data.collection.items[0].data[0].value).to.equal(
      "PatientGivenNameUpdated",
    );
    expect(data.collection.items[0].data[1].value).to.equal(
      "PatientFamilyNameUpdated",
    );
  });

  it("Delete patient", async () => {
    let response = await axios.delete(clinic1Patient2URL);
    expect(response.status).to.equal(200);

    response = await axios.get(CJ.getLinkCJFormat("patients").href);
    let data = response.data;
    expect(data.collection).to.exist;
    expect(data.collection.items).to.have.length(1);
    expect(data.collection.items[0].data[0].value).to.equal(
      "PatientGivenNameUpdated",
    );
  });
});

describe("Clinic 2 patient test", () => {
  let server;
  before(async () => {
    process.env.groups = "clinic2,admin";
    server = startServer();
    let absUrl = "http://localhost:3000";
    CJ.setAbsURL(absUrl);
  });

  after(() => stopServer(server));

  it("Return patient list", async () => {
    let response = await axios.get(CJ.getLinkCJFormat("patients").href);
    let data = response.data;

    expect(data.collection).to.exist;
    expect(data.collection.items).to.exist;
    expect(data.collection.items[0].data[0].name).to.equal("message");
  });

  it("Create patient", async () => {
    let patient = Object.create(template);
    patient.addData("givenName", "PatientGivenName2");
    patient.addData("familyName", "PatientFamilyName");
    patient.addData("taxID", "PatientTaxId1");
    patient.addData("telephone", "PatientTel");
    patient.addData("address", "PatientAddress");
    patient.addData("email", "PatientEmail");
    patient.addData("birthDate", "2023-02-02");

    let response = await axios.post(CJ.getLinkCJFormat("patients").href, {
      template: patient,
    });
    expect(response.status).to.equal(201);

    response = await axios.get(CJ.getLinkCJFormat("patients").href);
    let data = response.data;
    expect(data.collection).to.exist;
    expect(data.collection.items).to.have.length(1);

    // Access patient URL
    clinic2PatientURL = data.collection.items[0].href;
    response = await axios.get(clinic2PatientURL);
    data = response.data;
    expect(data.collection).to.exist;
    expect(data.collection.items).to.have.length(1);
    expect(data.collection.items[0].data[0].value).to.equal(
      "PatientGivenName2",
    );
  });

  it("No access to patients from another clinic", async () => {
    try {
      response = await axios.get(clinic1Patient1URL);
    } catch (error) {
      expect(error.response.status).to.equal(400);
    }
  });
});
