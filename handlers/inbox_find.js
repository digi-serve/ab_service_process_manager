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
      users: { array: true, required: true },
      roles: { array: true, optional: true },
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
               // make sure the .ui field is sent back as an object:
               list.forEach((l) => {
                  if (l.ui && typeof l.ui == "string") {
                     try {
                        l.ui = JSON.parse(l.ui);
                     } catch (e) {
                        req.log(
                           "Error: UserForm.ui is not valid JSON :" + l.ui
                        );
                        req.log(e);
                     }
                  }
                  if (l.options && typeof l.options == "string") {
                     try {
                        l.data = JSON.parse(l.options);
                     } catch (e) {
                        req.log(
                           "Error: UserForm.options is not valid JSON :" +
                              l.options
                        );
                        req.log(e);
                     }
                  }
               });

               cb(null, list);
            } else {
               cb(null, null);
            }
         })
         .catch((err) => {
            req.log(err);
            cb(err);

            if (err.toString().indexOf("MODULE_NOT_FOUND") != -1) {
               var msg = "UserForm.find() failed with MODULE_NOT_FOUND error:";
               console.log(msg, err);
               throw new Error(msg);
            }
         });
   },
};
