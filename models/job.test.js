"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: 'New Yobby Job',
        salary: 5000000, 
        equity: .512, 
        companyHandle: 'c3'
    };
  
    test("works", async function () {
      let job = await Job.create(newJob);
      expect(job).toEqual(newJob);
    });
  
    test("bad request with nonexistant company", async function () {
        const newJob2 = {...newJob};
        newJob2.companyHandle = 'not here';
        try {
            await Company.create(newJob2);
            fail();
        } catch (err) {
            expect(err instanceof Error).toBeTruthy();
        }
    });
});
  

/************************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
      let jobs = await Job.findAll({});
      expect(jobs.length).toBe(4);
    });
  
    test("works: filter by civil in job name", async function () {
      let jobs = await Job.findAll({title: "civil"});
      expect(jobs).toEqual([
        {
          id: 3,
          title: 'Consulting civil engineer',
          salary: 60000, 
          equity: 0, 
          companyHandle: 'c2'
        }
      ]);
    });
  
    test("works: filter by 200000 salary", async function () {
      let jobs = await Job.findAll({minSalary: 200000});
      expect(jobs).toEqual([
      {
            id: 2,
            title: 'Information officer',
            salary: 200000, 
            equity: 1, 
            companyHandle: 'c2'
        }
      ]);
    });
  
    test("works: filter by true hasEquity", async function () {
        let jobs = await Job.findAll({hasEquity: true});
        expect(jobs).toEqual([
        {
            id: 2,
            title: 'Information officer',
            salary: 200000, 
            equity: 1, 
            companyHandle: 'c2'
        }
        ]);
    });
  
    test("works: filter by 100000 salary, hasEquity is false", async function () {
      let jobs = await Job.findAll({minSalary: 100000, hasEquity: false});
      expect(jobs).toEqual([
        {
            id: 1,
            title: 'Conservator, furniture',
            salary: 110000, 
            equity: 0, 
            companyHandle: 'c1'
        },
        {
            companyHandle: "c2",
            equity: 1,
            id: 2,
            salary: 200000,
            title: "Information officer"
        },
      ]);
    });
    
    test("works: finds nothing", async function () {
      let jobs = await Job.findAll({title: 'awoioiwa2pl', minSalary: 2});
      expect(jobs).toEqual([
        
      ]);
    });
});

/************************************** get */

describe("get", function () {
    test("works", async function () {
        let job = await Job.get(1);
        expect(job).toEqual({
        id: 1,
        title: "Conservator, furniture",
        salary: 110000,
        equity: 0,
        companyHandle: "c1"
        });
    });

    test("not found if no such job", async function () {
        try {
        await Job.get(555);
        fail();
        } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});
  

/************************************** update */

describe("update", function () {
    const updateData = {
      title: "New yob",
      salary: 10000,
      equity: 1,
    };

    const updateBadData = {
        title: "new job",
        salary: 10,
        equity: 5,
        companyHandle: "c3"
      };
  
    test("works", async function () {
      let job = await Job.update(1, updateData);
      expect(job).toEqual({
        id: 1,
        ...updateData,
        companyHandle: "c1"
      });
  
    const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
             FROM jobs
             WHERE id=1`);
    result.rows[0].equity = Number(result.rows[0].equity);

      expect(result.rows).toEqual([{
        id: 1,
        title: "New yob",
        salary: 10000,
        equity: 1,
        companyHandle: "c1"
      }]);
    });
  
    test("works: null fields don't work", async function () {
      const updateDataSetNulls = {
        title: null,
        salary: 200, //null is still an int in sql
        equity: 1,
        // companyHandle: "c3"
      };
  
    
      expect(async () => {await Job.update(1, updateDataSetNulls)})
        .rejects.toThrow(); //if async f() throws err; in jest need to use .rejects.toThrow()
    });
  
    test("Error for invalid input", async function () {

      expect(async () => {await Job.update("nope", updateData)})
        .rejects.toThrow();
    });

    test("not found if no such company", async function () {
        try {
        await Job.update(555, updateData);
        fail();
        } catch (err) {
        expect(err instanceof Error).toBeTruthy();
        }
    });
    
    test("bad request with no data", async function () {
      try {
        await Job.update(1, {});
        fail();
      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
    });
});
  

/************************************** remove */

describe("remove", function () {
    test("works", async function () {
      await Job.remove(1);
      const res = await db.query(
          "SELECT id FROM jobs WHERE id=1");
      expect(res.rows.length).toEqual(0);
    });
  
    test("not found if no such Job", async function () {
      try {
        await Job.remove(555);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
});