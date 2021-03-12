/**
 * inbox_update
 * our Request handler.
 */

module.exports = {
   /**
    * Key: the cote message key we respond to.
    */
   key: "process_manager.inbox.update",

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
      user: { string: { uuid: true }, required: true },
      uuid: { string: { uuid: true }, required: true },
      response: { string: true, required: true },
   },

   /**
    * fn
    * our Request handler.
    * @param {obj} req
    *        the request object sent by the api_sails/api/controllers/process_manager/inbox_update.
    * @param {fn} cb
    *        a node style callback(err, results) to send data when job is finished
    */
   fn: function handler(req, cb) {
      req.log("in process_manager.inbox.update");

      var user = req.param("user");
      var uuid = req.param("uuid");
      var response = req.param("response"); // not required

      var UserForm = req.model("UserForm");
      UserForm.update(
         { uuid },
         { response, responder: user, status: "processed" }
      )
         .then((list) => {
            cb(null, list);
         })
         .catch((err) => {
            req.log(err);
            cb(err);
         });
   },
};
