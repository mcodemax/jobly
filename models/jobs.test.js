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