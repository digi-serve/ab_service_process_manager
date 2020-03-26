/**
 * inbox_find
 * our Request handler.
 */

module.exports = {
   /**
    * Key: the cote message key we respond to.
    */
   key: "process_manager.inbox.find",

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
      users: {
         required: true,
         validation: { type: "object" }
      },
      roles: {
         required: false,
         validation: { type: "array" } // ??
      }
   },

   /**
    * fn
    * our Request handler.
    * @param {obj} req
    *        the request object sent by the api_sails/api/controllers/process_manager/inbox_find.
    * @param {fn} cb
    *        a node style callback(err, results) to send data when job is finished
    */
   fn: function handler(req, cb) {
      //

      req.log("in process_manager.inbox.find");

      var users = req.param("users") || [];
      var roles = req.param("roles") || []; // not required

      if (users.length == 0 && roles.length == 0) {
         // this isn't right:
         req.log("Error: no user or role provided in query.");
         var invalidInputError = new Error(
            "Invalid Inputs. Provide either a user or a role."
         );
         cb(invalidInputError);
         return;
      }

      var UserForm = req.model("UserForm");
      UserForm.find({ users, roles, status: "pending" })
         .then((list) => {
            if (list) {
               cb(null, list);
            } else {
               cb(null, null);
            }
         })
         .catch((err) => {
            req.log(err);
            cb(err);
         });
   }
};
