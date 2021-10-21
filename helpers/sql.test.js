const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");


describe("Test sqlForPartialUpdate function", function(){
    test("Returns correct obj", function(){
        const obj = {
            "propOne": "Hi there 500",
            "propTwo": 500
        }

        const transJsToSql = {
            propOne: "prop_one",
            propTwo: "prop_two"
        }

        const result = sqlForPartialUpdate(obj, transJsToSql);
        
        expect(result).toEqual({setCols:'"prop_one"=$1, "prop_two"=$2', values: ["Hi there 500", 500]});
    })

    test("Throws error", function(){
        const transJsToSql = {
            propOne: "prop_one",
            propTwo: "prop_two"
        }
        
        expect(() => sqlForPartialUpdate({}, transJsToSql)).toThrow(BadRequestError);
    })
})