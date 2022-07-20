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
   fn: function handler(req, cb) {
      req.log("in process_manager.external");

      // get the AB for the current tenant
      ABBootstrap.init(req)
         .then((AB) => {
            var user = req.param("user");
            var uuid = req.param("uuid");
            var response = req.param("response");

            req.retry(() =>
               AB.objectProcessForm().model().update(uuid, {
                  response,
                  responder: user,
                  status: "processed",
               })
            )
               .then((list) => {
                  // respond to the API now:
                  cb(null, { success: true });

                  // now trigger a Run on the updated process instance
                  req.serviceRequest(
                     "process_manager.run",
                     { instanceID: list.process },
                     (err /*, results */) => {
                        if (err) {
                           req.notify.developer(err, {
                              context: "process_manager.external->run()",
                              instanceID: list.process,
                           });
                        }
                     }
                  );
               })
               .catch((err) => {
                  req.notify.developer(err, {
                     context: "process_manager.external",
                     user,
                     uuid,
                     response,
                  });
                  cb(err);
               });
         })
         .catch((err) => {
            req.notify.developer(err, {
               context:
                  "Service:process_manager.external: Error initializing Boostrap",
            });
            cb(err);
         });
   },
};
