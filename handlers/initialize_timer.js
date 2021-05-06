/**
 * initialize_timer
 * our Request handler.
 */

const ABBootstrap = require("../AppBuilder/ABBootstrap");
const ActiveTimer = require("../utils/active_timer");
const ABProcessTriggerTimer = require("../AppBuilder/platform/process/tasks/ABProcessTriggerTimer");
// {ABBootstrap}
// responsible for initializing and returning an {ABFactory} that will work
// with the current tenant for the incoming request.

module.exports = {
   /**
    * Key: the cote message key we respond to.
    */
   key: "process_manager.initialize_timer",

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
    *    "required" : {bool},
    *    "optional" : {bool},
    *
    *    // custom:
    *        "validation" : {fn} a function(value, {allValues hash}) that
    *                       returns { error:{null || {new Error("Error Message")} }, value: {normalize(value)}}
    * }
    */
   inputValidation: {
      // uuid: { string: { uuid: true }, required: true },
      // email: { string: { email: true }, optional: true },
   },

   /**
    * fn
    * our Request handler.
    * @param {obj} req
    *        the request object sent by the
    *        api_sails/api/controllers/process_manager/initialize_timer.
    * @param {fn} cb
    *        a node style callback(err, results) to send data when job is finished
    */
   fn: function handler(req, cb) {
      req.log("process_manager.initialize_timer:");

      // get the AB for the current tenant
      ABBootstrap.init(req)
         .then((AB) => { // eslint-disable-line

            AB.processes((p) => {
               if (!p) return;
      
               let triggerTimers = p.elements(
                  (e) => e instanceof ABProcessTriggerTimer
               );
      
               if (triggerTimers && triggerTimers.length) {
                  triggerTimers.forEach((e) => {
                     ActiveTimer.start(req, e);
                  });
               }
            });

            cb(null, { status: "success" });
         })
         .catch((err) => {
            req.notify.developer(err, {
               context: "Service:process_manager.initialize_timer: Error initializing ABFactory"
            });
            cb(err);
         });
   }
};
