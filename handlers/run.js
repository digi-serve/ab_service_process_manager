/**
 * process_manager.run
 * receives a signal to run a specific process instance(s). This pushes a
 * process to perform the next steps in the process.
 */

const ABBootstrap = require("../AppBuilder/ABBootstrap");
// {ABBootstrap}
// responsible for initializing and returning an {ABFactory} that will work
// with the current tenant for the incoming request.

module.exports = {
   /**
    * Key: the cote message key we respond to.
    */
   key: "process_manager.run",

   /**
    * inputValidation
    * define the expected inputs to this service handler:
    */
   inputValidation: {
      instanceID: { required: true },
      // instanceID can either be a {string} or {array[string]}
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
      req.log("process_manager.run:");

      // get the AB for the current tenant
      ABBootstrap.init(req)
         .then((AB) => {
            var instanceID = req.param("instanceID");

            // find which instances are being requested
            req.retry(() =>
               AB.objectProcessInstance()
                  .model()
                  .find({ uuid: instanceID }, req)
            )
               .then((list) => {
                  var allRuns = [];

                  (list || []).forEach((pi) => {
                     // find this instances parent process.
                     var processPI = AB.processByID(pi.processID);
                     if (!processPI) {
                        var piError = new Error(
                           "ProcessInstance could not find parent Process"
                        );
                        AB.notify.builder(piError, {
                           instanceID,
                           processID: pi.processID,
                        });
                        return;
                     }

                     // run the instance.
                     allRuns.push(processPI.run(pi, null, req));
                  });

                  // when they are all complete
                  Promise.all(allRuns)
                     .then(() => {
                        req.log(
                           `ran ${allRuns.length} task${
                              allRuns.length != 1 ? "s" : ""
                           }`
                        );
                        cb(null, allRuns.length);
                     })
                     .catch((err) => {
                        AB.notify.developer(err, {
                           context: "process_manager.run.allRuns",
                           instanceID,
                        });
                        cb(err);
                     });
               })
               .catch((err) => {
                  req.notify.developer(err, {
                     context:
                        "Service:process_manager.run: could not find ProcessInstance to run",
                     instanceID,
                  });
                  cb(err);
               });
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
