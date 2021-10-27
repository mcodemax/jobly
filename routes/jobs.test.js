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
  adminToken,
  jobsArr,
  jobsArrIds
} = require("./_testCommon");
const { ExpressError } = require("../expressError");

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

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
    
      const resp = await request(app).get("/jobs/").query({}); //add stuff2body title, minSalary, hasEquity
      
      expect(resp.body).toEqual({
        jobs:
            [
              {
                id: expect.any(Number), 
                ...jobsArr[0]
              },
              {
                id: expect.any(Number), 
                ...jobsArr[1]
              },
              {
                id: expect.any(Number), 
                ...jobsArr[2]
              },
              {
                id: expect.any(Number), 
                ...jobsArr[3]
              }
            ],
      });
      //reuse all testing from job in models  folder and just rewrite code for routes
    });

    test("works: filter by 100000 salary, hasEquity is false", async function () {
        const jobs = await request(app).get("/jobs/").query({minSalary: 100000, hasEquity: false});
        expect(jobs.body).toEqual({ "jobs": [
            {
                id: expect.any(Number), 
                ...jobsArr[0]
            },
            {
                id: expect.any(Number), 
                ...jobsArr[1]
            }
        ]});
    });

    test("works: finds nothing", async function () {
        const jobs = await request(app).get("/jobs/").query({title: 'awoioiwa2pl', minSalary: 2});
        expect(jobs.statusCode).toEqual(404);
    });
  
    test("fails: test next() handler", async function () {
      // there's no normal failure event which will cause this route to fail ---
      // thus making it hard to test that the error-handler works with it. This
      // should cause an error, all right :)
      await db.query("DROP TABLE jobs CASCADE");
      const resp = await request(app)
          .get("/jobs")
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(500);
    });

    test("GET /:id", async function () {
        const id = jobsArrIds[0];
        
        const resp = await request(app).get(`/jobs/${id}`); //add stuff2body title, minSalary, hasEquity
        const testjob = {...jobsArr[0]};
        delete testjob.id;
        delete testjob.companyHandle;
        delete testjob.companyName;
        
        expect(resp.body).toMatchObject({
          job: testjob
        });
        //reuse all testing from job in models  folder and just rewrite code for routes
      });

    test("GET /:id fails with bad id", async function () {
        const id = 39815;
        const resp = await request(app).get(`/jobs/${id}`); //add stuff2body title, minSalary, hasEquity
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    test("not works for users w/o admin access", async function () {
      const resp = await request(app)
          .patch(`/jobs/${jobsArrIds[0]}`)
          .send({
            title: "fudge-new"
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("unauth for anon", async function () {
      const resp = await request(app)
          .patch(`/jobs/${jobsArrIds[0]}`)
          .send({
            name: "fudge-new"
          });
      expect(resp.statusCode).toEqual(401);
    });
  
    test("job not found", async function () {
        
        const resp = await request(app)
            .patch(`/jobs/${jobsArrIds[3] + 1}`)
            .send({
                title: "fudge-new"
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });
  
    test("bad request on company change attempt", async function () {
        const resp = await request(app)
            .patch(`/jobs/${jobsArrIds[0]}`)
            .send({
                companyHandle: "NewHandle"
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(500);
    });
  
    test("bad request on invalid data", async function () {
        const resp = await request(app)
            .patch(`/jobs/${jobsArrIds[0]}`)
            .send({
                equity: 2
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("succesful update", async function () {
      const resp = await request(app)
          .patch(`/jobs/${jobsArrIds[0]}`)
          .send({ title:"Construction", salary:100000, equity:0.12515 })
          .set("authorization", `Bearer ${adminToken}`);
        console.log({res: resp.body})
      expect(resp.statusCode).toEqual(200);
    });
  });
  
  /************************************** DELETE /jobs/:id */
  
  describe("DELETE /jobs/:id", function () {
    test("not works for users", async function () {
      const resp = await request(app)
          .delete(`/jobs/${jobsArrIds[0]}`)
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("works for admins", async function () {
        const id = jobsArrIds[0];    
        const resp = await request(app)
            .delete(`/jobs/${id}`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({ deleted: id });
    });
    
    test("unauth for anon", async function () {
      const resp = await request(app)
          .delete(`/jobs/${jobsArrIds[0]}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("not found for no such job", async function () {
      const resp = await request(app)
          .delete(`/jobs/${jobsArrIds[3] + 1}`)
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(404);
    });
  });
  