const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

/**
 * This f() accepts a json request body e.g.:
 *  
 * {
 * 
 * "name":"Waste Mgmt Inc", 
 * 
 * "description":"oilets", 
 * 
 * "numEmployees":"510", 
 * 
 * "logoUrl":"https://poop.com"
 * 
 * },
 * 
 * accepts an obj for converting javascript vars to corresponding sql data column labels.
 * 
 * Then merges all the keys into a string e.g. `"name"=$1, "description"=$2...`
 * 
 * Then returns setCols as the keys turned into a string;
 * and an array with all the values to update from the json obj keys turned string
 * @param {Object} dataToUpdate A json object
 * @param {Object} jsToSql An object where keys are in javascript and values are the sql field labels
 * @returns {Object} {
 * 
 *   setCols //A string to be used in sql that has all the fields to update,
 * 
 *   values //An array with values to fill the sql fields with,
 * 
 * }
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };

//node -i -e "$(< sql.js)"
//^runs node in REPL