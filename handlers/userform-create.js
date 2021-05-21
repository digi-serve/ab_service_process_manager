/**
 * userform.create
 * our Request handler.
 */
const async = require("async");
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
            if (users && users.length > 0) {
               newForm.users = users;
            }

            // NOTE: Transition checks:
            // current v1 AppBuilder designer saves user.uuid for the users
            // in our processParticipants.  in v2, we need the .username
            // values.
            // Once ABDesigner is ported to v2, we can simplify these checks:
            //
            async.series(
               [
                  (done) => {
                     // Make sure we have correct values for our users
                     if (!newForm.users) {
                        return done();
                     }

                     // Prevent SiteUser.uuid(s) from being used.
                     req.retry(() =>
                        AB.objectUser()
                           .model()
                           .find({
                              or: [
                                 { uuid: newForm.users },
                                 { username: newForm.users },
                              ],
                           })
                     )
                        .then((usersFound) => {
                           if (usersFound.length == 0) {
                              req.notify.builder(
                                 new Error(
                                    "no matching users for provided settings"
                                 ),
                                 {
                                    context:
                                       "userform-create: verify valid users",
                                    newFormName: newForm.name,
                                    newFormprocess: newForm.process,
                                    users,
                                    roles,
                                 }
                              );
                           }
                           newForm.users = (usersFound || []).map(
                              (u) => u.username
                           );
                           done();
                        })
                        .catch(done);
                  },
                  (done) => {
                     req.retry(() =>
                        AB.objectProcessForm().model().create(newForm)
                     )
                        .then((form) => {
                           req.log("created form:", form.uuid);
                           cb(null, form);

                           // now broadcast the new Inbox Item:
                           req.broadcast
                              .inboxCreate(users, roles, form)
                              .then(() => {
                                 req.performance.log("broadcast.inbox.create");
                              });
                        })
                        .catch((err) => {
                           AB.notify.developer(err, {
                              context: "process_manager.userform_create",
                              newForm,
                           });
                           done(err);
                        });
                  },
               ],
               (err, result) => {
                  cb(err, result);
               }
            );

            // perform the create
         })
         .catch((err) => {
            req.notify.developer(err, {
               context:
                  "Service:process_manager.run: Error initializing ABFactory",
            });
            cb(err);
         });
   },
};
