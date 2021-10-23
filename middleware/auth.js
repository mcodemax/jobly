"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError, ExpressError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization; //I don't know what this is doing where is headers and headers.authorization coming from
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers
    
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY); //returns the payload if valid
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middle wear to ensure user is Admin to make a post */
function ensureAdmin(req, res, next) {
  try {
    if(res.locals.user.isAdmin === false){ //ref /routes/auth.js 
      throw new Error;
    }
    next();
  } catch (error) {
    return next(new UnauthorizedError('Need to be admin to use this route'));
  }
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin
};
