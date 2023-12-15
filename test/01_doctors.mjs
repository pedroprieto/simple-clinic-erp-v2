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
    let doctor = Object.create(template);
    doctor.addData("dayOfWeek", 1);
  });

  it("Create doctor schedule", async () => {
    process.env.groups = "clinic1,admin";
    let response = await axios.get(clinic1DoctorURL);
    let data = response.data;

    let doctor1ScheduleUrl = data.collection.links.find(
      (link) => link.name == "doctorSchedule",
    ).href;

    response = await axios.get(doctor1ScheduleUrl);
    data = response.data;

    expect(data.collection).to.exist;
    expect(data.collection.items).to.exist;
    expect(data.collection.items[0].data[0].name).to.equal("message");

    let doctorSchedule = Object.create(template);
    doctorSchedule.addData("dayOfWeek", 1);
    doctorSchedule.addData("opens", "08:00");
    doctorSchedule.addData("closes", "17:00");

    response = await axios.post(doctor1ScheduleUrl, {
      template: doctorSchedule,
    });
    expect(response.status).to.equal(201);

    let doctorSchedule2 = Object.create(template);
    doctorSchedule2.addData("dayOfWeek", 2);
    doctorSchedule2.addData("opens", "08:00");
    doctorSchedule2.addData("closes", "17:00");

    response = await axios.post(doctor1ScheduleUrl, {
      template: doctorSchedule2,
    });
    expect(response.status).to.equal(201);

    response = await axios.get(doctor1ScheduleUrl);
    data = response.data;
    expect(data.collection).to.exist;
    expect(data.collection.items).to.have.length(2);
    expect(data.collection.items[0].data[0].name).to.equal("dayOfWeek");

    // Delete
    let doctor2Schedule2Url = data.collection.items[0].href;
    response = await axios.delete(doctor2Schedule2Url);
    data = response.data;
    expect(response.status).to.equal(200);

    response = await axios.get(doctor1ScheduleUrl);
    data = response.data;
    expect(data.collection).to.exist;
    expect(data.collection.items).to.have.length(1);
  });
});
