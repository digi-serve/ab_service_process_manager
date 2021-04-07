/**
 * userform.create
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
      name: { string: true, required: true },
      process: { string: { uuid: true }, required: true },
      definition: { string: true, required: true },
      ui: { object: true, required: true },
      data: { object: true, required: true },
      roles: { array: true, optional: true },
      users: { array: true, optional: true },

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

      // get the AB for the current tenant
      ABBootstrap.init(req)
         .then((AB) => {
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
            AB.objectProcessForm()
               .model()
               .create(newForm)
               .then((form) => {
                  req.log("created form:", form.uuid);
                  cb(null, form);

                  // now broadcast the new Inbox Item:
                  req.broadcast.inboxCreate(users, roles, form).then(() => {
                     req.performance.log("broadcast.inbox.create");
                  });
               })
               .catch((err) => {
                  AB.notify.developer(err, {
                     context: "process_manager.userform_create",
                     newForm,
                  });
                  cb(err);
               });
         })
         .catch((err) => {
            req.logError("ERROR:", err);
            cb(err);
         });
   },
};
