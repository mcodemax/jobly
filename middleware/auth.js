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
    
    //https://stackoverflow.com/questions/3163407/javascript-and-operator-within-assignment
    // console.log(authHeader)
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      // console.log(token)
      res.locals.user = jwt.verify(token, SECRET_KEY); //returns the payload if valid
      // console.log(res.locals.user)
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

/** Middle wear to ensure user is Admin */
function ensureAdmin(req, res, next) {
  try {
    if(res.locals.user.isAdmin === false){ //ref /routes/auth.js 
      throw new Error;
    }
    return next();
  } catch (error) {
    return next(new UnauthorizedError('Need to be admin to use this route'));
  }
}

/** Middle wear to ensure user is Admin or Loggedin User */
function ensureAdminOrCorrectUser(req, res, next){
  // https://internationaltradeadministration.github.io/DevPortalMessages/IntroToNewAuthType.html
  // see section about bearer token
  try {
    const user = res.locals.user; //make sure this is res not req; doesn't make sense to make this the request
    
    //how this inequality works?
    if(!(user && (user.isAdmin || user.username === req.params.username))){
      // console.log(req.params.username, user.username) //why throws 500 error
      throw new UnauthorizedError('Need to be admin or requested user to use this route');
    }

    return next();
  } catch (error) { 
    return next(error);
  }
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureAdminOrCorrectUser
};
