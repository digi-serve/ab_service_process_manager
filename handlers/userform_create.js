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
    *    {joi.fn}   : {bool},  // performs: joi.{fn}();
    *    {joi.fn}   : {
    *       {joi.fn1} : true,   // performs: joi.{fn}().{fn1}();
    *       {joi.fn2} : { options } // performs: joi.{fn}().{fn2}({options})
    *    }
    *    // examples:
    *    "required" : {bool},  // default = false
    *
    *    // custom:
    *        "validation" : {fn} a function(value, {allValues hash}) that
    *                       returns { error:{null || {new Error("Error Message")} }, value: {normalize(value)}}
    * }
    */
   inputValidation: {
      // uuid: { string: { uuid: true }, required: true }
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

      // gather the jobData for this request:
      var newForm = {
         name: req.param("name"),
         process: req.param("process"),
         definition: req.param("definition"),
         ui: req.param("ui"),
         data: req.param("data"),
      };

      var roles = req.param("roles");
      if (roles) {
         newForm.roles = roles;
      }

      var users = req.param("users");
      if (users) {
         newForm.users = users;
      }

      // perform the create
      var UserForm = req.model("UserForm");
      UserForm.create(newForm)
         .then((form) => {
            req.log("created form:", form);
            cb(null, form);
         })
         .catch((err) => {
            req.log("Error creating UserForm: ", err);
            cb(err);
         });
   },
};
