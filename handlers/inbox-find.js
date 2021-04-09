/**
 * inbox_find
 * our Request handler.
 */

const ABBootstrap = require("../AppBuilder/ABBootstrap");
// {ABBootstrap}
// responsible for initializing and returning an {ABFactory} that will work
// with the current tenant for the incoming request.

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

      // get the AB for the current tenant
      ABBootstrap.init(req)
         .then((AB) => {
            var users = req.param("users") || [];
            var roles = req.param("roles") || [];

            if (users.length == 0 && roles.length == 0) {
               // this isn't right:
               req.log("Error: no user or role provided in query.");
               var invalidInputError = new Error(
                  "Invalid Inputs. Provide either a user or a role."
               );
               cb(invalidInputError);
               return;
            }

            // build our condition
            var cond = { status: "pending" };
            if (users.length) {
               cond.users = users;
            }
            if (roles.length) {
               cond.roles = roles;
            }

            req.retry(() => AB.objectProcessForm().model().find(cond, req))
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
                  req.notify.developer(err, {
                     context: "process_manager.inbox.find",
                     users,
                     roles,
                     req,
                  });
                  cb(err);

                  // if (err.toString().indexOf("MODULE_NOT_FOUND") != -1) {
                  //    var msg =
                  //       "UserForm.find() failed with MODULE_NOT_FOUND error:";
                  //    console.log(msg, err);
                  //    throw new Error(msg);
                  // }
               });
         })
         .catch((err) => {
            req.notify.developer(err, {
               context:
                  "Service:process_manager.inbox.find: Error initializing Boostrap",
            });
            cb(err);
         });
   },
};
