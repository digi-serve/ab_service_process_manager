/**
 * status
 * our Request handler.
 */

module.exports = {
   /**
    * Key: the cote message key we respond to.
    */
   key: "process_manager.userform.status",

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
      formID: {
         required: true,
         validation: { type: "uuid" }
      }
   },

   /**
    * fn
    * our Request handler.
    * @param {obj} req
    *        the request object sent by the api_sails/api/controllers/process_manager/status.
    * @param {fn} cb
    *        a node style callback(err, results) to send data when job is finished
    */
   fn: function handler(req, cb) {
      //
      req.log("in process_manager.userform.status.");

      var uuid = req.param("formID");

      var UserForm = req.model("UserForm");
      UserForm.find({ uuid })
         .then((list) => {
            if (list && list.length > 0) {
               cb(null, list[0]);
            } else {
               cb(null, null);
            }
         })
         .catch(cb);
   }
};
