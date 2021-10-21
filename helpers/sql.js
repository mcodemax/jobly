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
 * and accepts an obj for converting javascript vars to corresponding sql data column labels.
 * 
 * e.g. {
 * 
 * keyOne: "key_one"
 * 
 * keyTwo: "key_two"
 * 
 * }
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

/** Compare the keys of 2 objects */
function compareKeys(a, b) {
  let aKeys = Object.keys(a).sort();
  let bKeys = Object.keys(b).sort();
  return JSON.stringify(aKeys) === JSON.stringify(bKeys);
}

/** Take in array of Keys and an object returns true/false if all keys in object */
function seeIfKeysInObj(keysArr, obj){
  for(let k of keysArr){
    if(!obj.hasOwnProperty(k)) return false;
  }
  return true;
}

/** Take in obj and array => true/false if all obj's keys in array */
function seeIfObjKeysInArr(obj, arr){
  const objKeys = Object.keys(obj);
  for(let k of objKeys){
    if(!arr.includes(k)) return false;
  }

  return true;
}

module.exports = { sqlForPartialUpdate, compareKeys, seeIfKeysInObj, seeIfObjKeysInArr };

//node -i -e "$(< sql.js)"
//^runs node in REPL