"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if equity > 1.0 or salary < 0, psql might have errors built in.
   * 
   * I e.g.: { "title":"Chill Yob", "salary":"188800", "equity":"1", "company_handle":"hall-davis" }
   * */
  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * */

  static async findAll({title, minSalary, hasEquity}) {
    let sqlWhereStr = ``;
    let values = [];

    if(name){
      values.push(`%${name}%`);
      sqlWhereStr = sqlWhereStr.concat(`WHERE name ILIKE $${values.length}`);
    }//values.length will be the index to be used in sql by node pg

    if(minEmployees){
      values.push(minEmployees);
      if(values.length > 1){
        sqlWhereStr = sqlWhereStr.concat(` AND num_employees >= $${values.length}`)
      }else{//if minEmployees is filtered for but not name
        sqlWhereStr = sqlWhereStr.concat(`WHERE num_employees >= $${values.length}`)
      }
    }

    if(maxEmployees){
      values.push(maxEmployees);
      if(values.length > 1){
        sqlWhereStr = sqlWhereStr.concat(` AND num_employees <= $${values.length}`)
      }else{//if maxEmployees is the only criteria filtered for
        sqlWhereStr = sqlWhereStr.concat(`WHERE num_employees <= $${values.length}`)
      }
    }

    const querySql = `SELECT handle,
                            name,
                            description,
                            num_employees AS "numEmployees",
                            logo_url AS "logoUrl"
                        FROM companies
                        ${sqlWhereStr}  
                        ORDER BY name`;
    //in pg AS uses "" and WHERE uses ''
    const companiesRes = await db.query(querySql, values);
    return companiesRes.rows;
  }

  /** Given a job id (or title??? its not unique tho to the job), return data about job.
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
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
