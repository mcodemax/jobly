"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError, ExpressError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const JobNewSchema = require("../schemas/jobNew.json");
const JobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

const {seeIfObjKeysInArr} = require("../helpers/sql")

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: Admin //make sure documentation for admin access same on company.js route
 * 
 * json schema e.g. { "title":"Construction", "salary":100000, "equity":0.12515, "companyHandle":"hunter-inc" } salary needs to be more than 0 , equity <= 1 but >=0
 */
router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, JobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * Can filter on provided search filters:
 * - title
 * - minSalary
 * - hasEquity  //name (will find case-insensitive, partial matches) fix documentation and change to <-- in company route
 *
 * Authorization required: none
 */
router.get("/", async function (req, res, next) {// example query str => ?title=construction&minSalary=55000&hasEquity=true
  try {
    const {title} = req.query;
    const minSalary = req.query.minSalary ? Number(req.query.minSalary) : undefined;
    let {hasEquity} = req.query;

    if(typeof hasEquity === 'string'){
      hasEquity = hasEquity.toLocaleLowerCase();
      if(hasEquity === 'true'){
        hasEquity = true;
      }else if(hasEquity === 'false'){
        hasEquity = false;
      }else{
        throw new BadRequestError(`hasEquity must be true or false if wanted`);
      }
    }

      
      
    if(minSalary < 0){//test if minSalary undefined?
      throw new BadRequestError(`minSalary must be >= 0`);
    }

    if(!seeIfObjKeysInArr(req.query, ['title','minSalary','hasEquity'])){
      throw new BadRequestError(`A key wasn't allowed here, only accepting 'title','minSalary','hasEquity'`);
    }
    // console.log({title, minSalary, hasEquity})
    const jobs = await Job.findAll({title, minSalary, hasEquity});
    
    if(jobs.length === 0) throw new ExpressError('Jobs not found', 404)
    
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});



/** GET /[id]  =>  { job }
 *
 *  
 *  job is [{ id, title, salary, equity, companyHandle }]
 *
 * Authorization required: none
 */
router.get("/:id", async function (req, res, next) {
  try {
    const job = await Job.get(req.params.id);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { fld1, fld2, ... } => { company }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: Admin
 * 
 * json schema e.g. { "title":"Construction", "salary":100000, "equity":0.12515 } salary needs to be more than 0 , equity <= 1 but >=0
 */
router.patch("/:id", ensureAdmin, async function (req, res, next) {
  try {
    
    const validator = jsonschema.validate(req.body, JobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await job.update(req.params.id, req.body);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: id }
 *
 * Authorization: admin
 */
router.delete("/:id", ensureAdmin, async function (req, res, next) {
  try {
    await Company.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;