"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const Job = require("./job")
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

/** Related functions for users. */

class User {
  /** authenticate user with username, password.
   *
   * Returns { username, first_name, last_name, email, is_admin }
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/

  static async authenticate(username, password) {
    // try to find the user first
    const result = await db.query(
          `SELECT username,
                  password,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
        [username],
    );

    const user = result.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  /** Register user with data.
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws BadRequestError on duplicates.
   **/

  static async register(
      { username, password, firstName, lastName, email, isAdmin }) {
    const duplicateCheck = await db.query(
          `SELECT username
           FROM users
           WHERE username = $1`,
        [username],
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
          `INSERT INTO users
           (username,
            password,
            first_name,
            last_name,
            email,
            is_admin)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin"`,
        [
          username,
          hashedPassword,
          firstName,
          lastName,
          email,
          isAdmin,
        ],
    );

    const user = result.rows[0];

    return user;
  }

  /** Find all users.
   *
   * Returns [{ username, first_name, last_name, email, is_admin }, ...]
   **/

  static async findAll() {
    const users = await db.query(
          `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           ORDER BY username`,
    );
    // SELECT users.username,
    // first_name AS "firstName",
    // last_name AS "lastName",
    // email,
    // is_admin AS "isAdmin",
    // job_id
    // FROM users LEFT JOIN applications ON users.username = applications.username
    // ORDER BY username


    const userJobIds = await db.query(`
          SELECT username, job_id AS "jobId"
          FROM applications
    `);

    // for(let application of userJobIds.rows){
    //   // for every app, append jobId to users

    // }

    const userNameDict = {};//usernames are unique so no conflicts
    users.rows.forEach(user => { //add an empty arr to a username dictionary
      //implemented to make everything O(n)
      userNameDict[user.username] = [];
    });

    userJobIds.rows.forEach(jobUserPair => {
      if(jobUserPair.username in userNameDict){
        userNameDict[jobUserPair.username].push(jobUserPair.jobId);
      }
    });

    users.rows.forEach(user => {
      console.log(user)
      if(userNameDict[user.username].length === 0){
        userNameDict[user.username].push('No Jobs');
      }
    });

    users.rows.forEach(user => { //this is to append all jobs onto each user applied to
      user.jobs = userNameDict[user.username];
      //implemented to make everything O(n)
    });

    console.log(users.rows)

    return users.rows;
  }

  /** Given a username, return data about user.
   *
   * Returns { username, first_name, last_name, is_admin, jobs }
   *   where jobs is { id, title, company_handle, company_name, state }
   *
   * Throws NotFoundError if user not found.
   **/

  static async get(username) {
    const userRes = await db.query(
          `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
        [username],
    );

    const userApplications = await db.query(
          `SELECT job_id AS "jobId"
           FROM applications
           WHERE username = $1`,
        [username]
    );

    const user = userRes.rows[0];
      
    if (!user) throw new NotFoundError(`No user: ${username}`);

    if(userApplications.rows.length !== 0){
      user.jobs = userApplications.rows.map(jobNum => jobNum.jobId);
    }else{
      user.jobs = ['No jobs'];
    }

    return user;
  }

  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { firstName, lastName, password, email, isAdmin }
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws NotFoundError if not found.
   *
   * WARNING: this function can set a new password or make a user an admin.
   * Callers of this function must be certain they have validated inputs to this
   * or a serious security risks are opened.
   */

  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          firstName: "first_name",
          lastName: "last_name",
          isAdmin: "is_admin",
        });
    const usernameVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
                                first_name AS "firstName",
                                last_name AS "lastName",
                                email,
                                is_admin AS "isAdmin"`;
    const result = await db.query(querySql, [...values, username]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    delete user.password;
    return user;
  }

  /** Delete given user from database; returns undefined. */

  static async remove(username) {
    let result = await db.query(
          `DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
        [username],
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);
  }

  static async apply(username, jobId){
    await this.get(username); //throws err id user not exist
    const jobResult = await Job.get(jobId); //throws err if jobId doesn't exist
    
    const result = await db.query(`INSERT
                  INTO applications
                  (username, job_id)
                  VALUES ($1, $2)
                  RETURNING username, job_id AS "jobId"`,
              [username, jobId]);

    const applied = result.rows[0];

    return applied.jobId;
  }
}
//node -i -e "$(< user.js)"


module.exports = User;
