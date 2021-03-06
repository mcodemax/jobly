"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Company = require("../models/company");
const Job = require("../models/job")
const { createToken } = require("../helpers/tokens");

const jobsArr = [
  {
    title: 'Conservator, furniture',
    salary: 110000,
    equity: 0,
    companyHandle: 'c1',
    companyName: 'C1'
  },
  {
    title: 'Information officer',
    salary: 200000,
    equity: 1,
    companyHandle: 'c2',
    companyName: 'C2'
  },
  {
    title: 'Consulting civil engineer',
    salary: 60000,
    equity: 0,
    companyHandle: 'c2',
    companyName: 'C2'
  },
  {
    title: 'Early years teacher',
    salary: 55000,
    equity: 0,
    companyHandle: 'c2',
    companyName: 'C2'
  }
]

const jobsArrIds = [];

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");

  await Company.create(
      {
        handle: "c1",
        name: "C1",
        numEmployees: 1,
        description: "Desc1",
        logoUrl: "http://c1.img",
      });
  await Company.create(
      {
        handle: "c2",
        name: "C2",
        numEmployees: 2,
        description: "Desc2",
        logoUrl: "http://c2.img",
      });
  await Company.create(
      {
        handle: "c3",
        name: "C3",
        numEmployees: 3,
        description: "Desc3",
        logoUrl: "http://c3.img",
      });

  await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com",
    password: "password1",
    isAdmin: false,
  });
  await User.register({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "user2@user.com",
    password: "password2",
    isAdmin: false,
  });
  await User.register({
    username: "u3",
    firstName: "U3F",
    lastName: "U3L",
    email: "user3@user.com",
    password: "password3",
    isAdmin: false,
  });

  let job = await Job.create(jobsArr[0]);
  jobsArrIds.push(job.id)
  job = await Job.create(jobsArr[1]);
  jobsArrIds.push(job.id)
  job = await Job.create(jobsArr[2]);
  jobsArrIds.push(job.id)
  job = await Job.create(jobsArr[3]);
  jobsArrIds.push(job.id)

  await User.apply("u1",jobsArrIds[0]);
  await User.apply("u1",jobsArrIds[1]);
}



async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}


const u1Token = createToken({ username: "u1", isAdmin: false });
const adminToken = createToken({ username: "uAdmin", isAdmin: true });

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
  jobsArr,
  jobsArrIds
};
