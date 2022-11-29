/**
 * process_manager.trigger
 * receives a signal for a trigger, and then initiates a new process for any
 * process that responds to that trigger.
 */

const ABBootstrap = require("../AppBuilder/ABBootstrap");
// {ABBootstrap}
// responsible for initializing and returning an {ABFactory} that will work
// with the current tenant for the incoming request.

module.exports = {
   /**
    * Key: the cote message key we respond to.
    */
   key: "process_manager.trigger",

   /**
    * inputValidation
    * define the expected inputs to this service handler:
    */
   inputValidation: {
      key: { string: true, required: true },
      data: { object: true, required: true },
      requestId: { string: true, required: false }, // Needed to prevent duplicates if the request is retried
      // email: { string: { email: true }, optional: true },
   },

   /**
    * fn
    * our Request handler.
    * @param {obj} req
    *        the request object sent by the
    *        api_sails/api/controllers/process_manager/trigger.
    * @param {fn} cb
    *        a node style callback(err, results) to send data when job is finished
    */
   fn: function handler(req, cb) {
      req.log("process_manager.trigger:");

      // get the AB for the current tenant
      ABBootstrap.init(req)
         .then((AB) => {
            var key = req.param("key");
            var data = req.param("data");

            var allTriggers = [];
            AB.processes().forEach((p) => {
               var t = p.taskForTriggerKey(key);
               if (t) {
                  const requestId = req.param("requestId");
                  const instanceKey = requestId
                     ? `${requestId}.${t.id}`
                     : undefined;
                  // allTriggers.push(retryTrigger(t, data, req));
                  allTriggers.push(
                     req.retry(() => t.trigger(data, req, instanceKey))
                  );
               }
            });

            Promise.all(allTriggers)
               .then(() => {
                  req.log(
                     `triggered ${allTriggers.length} task${
                        allTriggers.length != 1 ? "s" : ""
                     }`
                  );
                  cb(null, allTriggers.length);
               })
               .catch((err) => {
                  req.notify.developer(err, {
                     context: "Process->Trigger() : error during trigger.",
                  });
                  cb(err);
               });
         })
         .catch((err) => {
            req.notify.developer(err, {
               context:
                  "Service:process_manager.trigger: Error initializing ABFactory",
            });
            cb(err);
         });
   },
};
