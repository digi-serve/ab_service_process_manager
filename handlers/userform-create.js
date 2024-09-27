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
      scopeQuery: { object: true, optional: true },
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
   fn: async function handler(req, cb) {
      try {
         // get the AB for the current tenant
         const AB = await ABBootstrap.init(req);

         // gather the jobData for this request:
         const newForm = {
            name: req.param("name"),
            process: req.param("process"),
            definition: req.param("definition"),
            ui: req.param("ui"),
            data: req.param("data"),
            scopeQuery: req.param("scopeQuery"),
         };

         const roles = req.param("roles");
         if (roles) {
            newForm.roles = roles;
         }

         let users = req.param("users");
         if (users && !Array.isArray(users))
            users = [users];

         if (users?.length > 0) {
            newForm.users = users;
         }

         // NOTE: Transition checks:
         // current v1 AppBuilder designer saves user.uuid for the users
         // in our processParticipants.  in v2, we need the .username
         // values.
         // Once ABDesigner is ported to v2, we can simplify these checks:
         //

         // Make sure we have correct values for our users
         if (newForm.users) {
            // Prevent SiteUser.uuid(s) from being used.
            const usersFound =
               (await req.retry(() =>
                  AB.objectUser()
                     .model()
                     .findAll({
                        where: {
                           glue: "or",
                           rules: [
                              {
                                 key: "uuid",
                                 rule: "in",
                                 value: newForm.users,
                              },
                              {
                                 key: "username",
                                 rule: "in",
                                 value: newForm.users,
                              },
                           ],
                        },
                        populate: false,
                     })
               )) ?? [];

            if (usersFound.length == 0) {
               req.notify.builder(
                  new Error("no matching users for provided settings"),
                  {
                     context: "userform-create: verify valid users",
                     newFormName: newForm.name,
                     newFormprocess: newForm.process,
                     scopeOuery: newForm.scopeQuery,
                     users,
                     roles,
                  }
               );
            }
            newForm.users = usersFound.map((u) => u.username);
         }

         try {
            const formModel = await AB.objectProcessForm().model();
            // create the form
            let form = await req.retry(() => formModel.create(newForm));

            // If this is an external task with a url we need to add this
            // form's uuid as a query param (task=form.uuid) this will allow
            // the external site to report the form is done using
            // POST /process/external?uuid=form.uuid
            if (form.data.url) {
               const url = `${form.data.url}${
                  form.data.url.includes("?") ? "&" : "?"
               }task=${form.uuid}`;
               const dataClone = { ...form.data };
               dataClone.url = url;
               form = await req.retry(() =>
                  formModel.update(form.uuid, { data: dataClone })
               );
            }

            req.log("created form:", form.uuid);
            cb(null, form);

            if (newForm.scopeQuery) return;

            // now broadcast the new Inbox Item:
            await req.broadcast.inboxCreate(users, roles, form);
            req.performance.log("broadcast.inbox.create");
         } catch (err) {
            AB.notify.developer(err, {
               context: "process_manager.userform_create",
               newForm,
            });
            cb(err);
         }
      } catch (err) {
         req.notify.developer(err, {
            context:
               "Service:process_manager.run: Error initializing ABFactory",
         });
         cb(err);
      }
   },
};
