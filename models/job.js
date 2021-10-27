"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");
const Company = require("./company");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if equity > 1.0 or salary < 0, psql might have errors built in.
   * 
   * I e.g.: { "title":"Chill Yob", "salary":"188800", "equity":"1", "companyHandle":"hall-davis" }
   * */
  static async create({ title, salary, equity, companyHandle }) {
    await Company.get(companyHandle); //throws err if company doesn't exist

      // throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          title, 
          salary,
          equity,
          companyHandle
        ],
    );
    const job = result.rows[0];
    job.equity = Number(job.equity);

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * */

  static async findAll({title, minSalary, hasEquity}) {
    let sqlWhereStr = ``;
    let values = [];

    if(title){
      values.push(`%${title}%`);
      sqlWhereStr = sqlWhereStr.concat(`WHERE title ILIKE $${values.length}`);
    }

    if(minSalary){
      values.push(minSalary);
      if(values.length > 1){ //values.length will be the index to be used in sql by node pg
        sqlWhereStr = sqlWhereStr.concat(` AND salary >= $${values.length}`);
      }else{//if minSalary is filtered for but not name
        sqlWhereStr = sqlWhereStr.concat(`WHERE salary >= $${values.length}`);
      }
    }

    if(hasEquity && (hasEquity === true)){
      //if true, filter to jobs that provide a non-zero amount of equity. 
      if(values.length > 0){
        sqlWhereStr = sqlWhereStr.concat(` AND equity > 0`);
      }else{//if hasEquity is the only criteria filtered for
        console.log('------------------')
        sqlWhereStr = sqlWhereStr.concat(`WHERE equity > 0`);
      }
      // If false or not included in the filtering, list all jobs regardless of equity
    }

    const querySql = `SELECT id,
                            title,
                            salary,
                            equity,
                            company_handle AS "companyHandle",
                            companies.name AS "companyName"
                        FROM jobs LEFT JOIN companies ON jobs.company_handle = companies.handle
                        ${sqlWhereStr}
                        `;

    //in pg AS uses "" and WHERE uses ''
    const jobsRes = await db.query(querySql, values);
    const jobs = jobsRes.rows;
    
    jobs.forEach(job => {
      job.equity = Number(job.equity); 
    });

    return jobs;
  }

  /** Given a job id (or title??? its not unique tho to the job), return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT id, 
                  title, 
                  salary, 
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    job.equity = Number(job.equity);
    

    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`, [job.companyHandle]);

    delete job.companyHandle;
    job.company = companiesRes.rows[0];

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity } //id & company handle can't be altered
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   */
  static async update(id, data) {//have to parseInt id??
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          companyHandle: "company_handle"
        });
    const IdVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${IdVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity,
                                company_handle AS "companyHandle"
                                `;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];
    
    job.equity = Number(job.equity);
      
    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No job id: ${id}`);
  }
}


module.exports = Job;
