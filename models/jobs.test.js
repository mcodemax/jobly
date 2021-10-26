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


/************************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
      let jobs = await Job.findAll({});
      console.log(jobs)
      expect(jobs.length).toBe(4);
    });
  
    test("works: filter by c in company name", async function () {
      let jobs = await Job.findAll({name: "c"});
      expect(jobs).toEqual([
        {
          handle: "c1",
          name: "C1",
          description: "Desc1",
          numEmployees: 1,
          logoUrl: "http://c1.img",
        },
        {
          handle: "c2",
          name: "C2",
          description: "Desc2",
          numEmployees: 2,
          logoUrl: "http://c2.img",
        },
        {
          handle: "c3",
          name: "C3",
          description: "Desc3",
          numEmployees: 3,
          logoUrl: "http://c3.img",
        },
      ]);
    });
  
    test("works: filter by 2 in company name", async function () {
      let jobs = await Job.findAll({name: '2'});
      expect(jobs).toEqual([
        {
          handle: "c2",
          name: "C2",
          description: "Desc2",
          numEmployees: 2,
          logoUrl: "http://c2.img",
        }
      ]);
    });
  
    test("works: filter by at least 2 employees and has 2 in name", async function () {
      let jobs = await Job.findAll({name: '2', minEmployees: 2});
      expect(jobs).toEqual([
        {
          handle: "c2",
          name: "C2",
          description: "Desc2",
          numEmployees: 2,
          logoUrl: "http://c2.img",
        }
      ]);
    });
  
    test("works: filter by at least 2 employees and has c in name", async function () {
      let jobs = await Job.findAll({name: 'c', minEmployees: 2});
      expect(jobs).toEqual([
        {
          handle: "c2",
          name: "C2",
          description: "Desc2",
          numEmployees: 2,
          logoUrl: "http://c2.img",
        },
        {
          handle: "c3",
          name: "C3",
          description: "Desc3",
          numEmployees: 3,
          logoUrl: "http://c3.img",
        }
      ]);
    });
  
    test("works: filter by at most 2 employees and has c in name", async function () {
      let jobs = await Job.findAll({name: 'c', maxEmployees: 2});
      expect(jobs).toEqual([
        {
          handle: "c1",
          name: "C1",
          description: "Desc1",
          numEmployees: 1,
          logoUrl: "http://c1.img",
        },
        {
          handle: "c2",
          name: "C2",
          description: "Desc2",
          numEmployees: 2,
          logoUrl: "http://c2.img",
        }
      ]);
    });
  
    test("works: filter by 2 to 3 employees and has c in name", async function () {
      let jobs = await Job.findAll({name: 'c', minEmployees: 2, maxEmployees: 3});
      
      expect(jobs).toEqual([
        {
          handle: "c2",
          name: "C2",
          description: "Desc2",
          numEmployees: 2,
          logoUrl: "http://c2.img",
        },
        {
          handle: "c3",
          name: "C3",
          description: "Desc3",
          numEmployees: 3,
          logoUrl: "http://c3.img",
        }
      ]);
    });
  
    test("works: finds nothing", async function () {
      let jobs = await Job.findAll({name: 'pl', minEmployees: 2});
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