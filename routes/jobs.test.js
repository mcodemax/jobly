"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
    const newJob = {
        title: 'New Yobby Job',
        salary: 5000000, 
        equity: .512, 
        companyHandle: 'c3'
    };
  
    test("ok for admins", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${adminToken}`); 
        expect(resp.statusCode).toEqual(201);
        console.log(resp.body)
        expect(resp.body).toEqual({"job":{
            id: expect.any(Number),
            ...newJob
        }});
    });

    test("blocked for nonadmins", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`); 
        expect(resp.statusCode).toEqual(401);
    });
  
    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                companyHandle: "new waifh8ah87",
                salary: 10,
            })
            .set("authorization", `Bearer ${adminToken}`); //https://davidburgos.blog/authenticated-requests-supertest/
        expect(resp.statusCode).toEqual(400);
    });
  
    // test("bad request with extra data", async function () {
    //     const resp = await request(app)
    //         .post("/jobs")
    //         .send({
    //             ...newJob,
    //             logoUrl: "not-a-url",
    //         })
    //         .set("authorization", `Bearer ${adminToken}`);
    //     expect(resp.statusCode).toEqual(400);
    // }); not implemented
});

