/**
 * timer-start
 * our Request handler.
 */

const ABBootstrap = require("../AppBuilder/ABBootstrap");
// {ABBootstrap}
// responsible for initializing and returning an {ABFactory} that will work
// with the current tenant for the incoming request.

const ActiveTimer = require("../utils/active_timer");

module.exports = {
   /**
    * Key: the cote message key we respond to.
    */
   key: "process_manager.timer-start",

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
      uuid: { string: { uuid: true }, required: true },
   },

   /**
    * fn
    * our Request handler.
    * @param {obj} req
    *        the request object sent by the
    *        api_sails/api/controllers/process_manager/timer-start.
    * @param {fn} cb
    *        a node style callback(err, results) to send data when job is finished
    */
   fn: function handler(req, cb) {
      req.log("process_manager.timer-start:");

      // get the AB for the current tenant
      ABBootstrap.init(req)
         .then((AB) => { // eslint-disable-line
            const ID = req.param("uuid");

            let timer = null;

            // find the timer element:
            AB.processes().forEach((p) => {
               if (!p) return;

               let element = p.elementByID(ID);
               if (element && element.isEnabled) {
                  timer = element;
               }
            });

            if (timer) ActiveTimer.start(req, timer);
            else {
               let errNotFound = new Error(`Timer[${ID}] not found.`);
               req.notify.developer(errNotFound, { ID });
            }

            cb(null, { status: "success" });
         })
         .catch((err) => {
            req.notify.developer(err, {
               context:
                  "Service:process_manager.timer-start: Error initializing ABFactory",
            });
            cb(err);
         });
   },
};
