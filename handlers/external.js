/**
 * external
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
   key: "process_manager.external",

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
      user: { string: true, required: true },
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
   fn: async function handler(req, cb) {
      req.log("in process_manager.external");

      try {
         // get the AB for the current tenant
         const AB = await ABBootstrap.init(req);
         const uuid = req.param("uuid");
         const roles = await AB.objectRole().model().findAll();

         req.broadcast.inboxUpdate(null, roles, { uuid });
         cb();
      } catch (err) {
         req.notify.developer(err, {
            context:
               "Service:process_manager.external: Error initializing Boostrap",
         });
         cb(err);
      }
   },
};
