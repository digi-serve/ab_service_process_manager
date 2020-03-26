/**
 * userform.create
 * our Request handler.
 */

module.exports = {
   /**
    * Key: the cote message key we respond to.
    */
   key: "process_manager.userform.create",

   /**
    * inputValidation
    * define the expected inputs to this service handler:
    * Format:
    * "parameterName" : {
    *    "required" : {bool},  // default = false
    *    "validation" : {fn|obj},
    *                   {fn} a function(value) that returns true/false if
    *                        the value is valid.
    *                   {obj}: .type: {string} the data type
    *                                 [ "string", "uuid", "email", "number", ... ]
    * }
    */
   inputValidation: {
      // uuid: {
      //    required: true,
      //    validation: { type: "uuid" }
      // }
   },

   /**
    * fn
    * our Request handler.
    * @param {obj} req
    *        the request object sent by the api_sails/api/controllers/process_manager/userform.create.
    * @param {fn} cb
    *        a node style callback(err, results) to send data when job is finished
    */
   fn: function handler(req, cb) {
      //
      req.log("in process_manager.userform.create");

      var UserForm = req.model("UserForm");
      UserForm.create({
         name: req.param("name"),
         process: req.param("process"),
         definition: req.param("definition"),
         roles: req.param("roles")
      })
         .then((form) => {
            req.log("created form:", form);
            cb(null, form);
         })
         .catch((err) => {
            req.log("Error creating UserForm: ", err);
            cb(err);
         });
   }
};
