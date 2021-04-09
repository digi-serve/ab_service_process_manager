/**
 * process_manager.reset
 * receives a signal to reset a specific process & task. This will cause that
 * task to restart and run again.
 */

const ABBootstrap = require("../AppBuilder/ABBootstrap");
// {ABBootstrap}
// responsible for initializing and returning an {ABFactory} that will work
// with the current tenant for the incoming request.

module.exports = {
   /**
    * Key: the cote message key we respond to.
    */
   key: "process_manager.reset",

   /**
    * inputValidation
    * define the expected inputs to this service handler:
    */
   inputValidation: {
      instanceID: { required: true },
      // instanceID can either be a {string} or {array[string]}
      taskID: { string: { uuid: true }, required: true },
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
      req.log("process_manager.reset:");

      // get the AB for the current tenant
      ABBootstrap.init(req)
         .then((AB) => {
            var instanceID = req.param("instanceID");
            var taskID = req.param("taskID");

            // find which ProcessInstances are being requested

            req.retry(() =>
               AB.objectProcessInstance()
                  .model()
                  .find({ uuid: instanceID }, req)
            ).then((list) => {
               var allResets = [];

               (list || []).forEach((pi) => {
                  // find the parent process for the instance
                  var processPI = AB.processByID(pi.processID);
                  if (!processPI) {
                     var piError = new Error(
                        "ProcessInstance could not find parent Process"
                     );
                     AB.notify.builder(piError, {
                        instanceID,
                        processID: pi.processID,
                        req,
                     });
                     return;
                  }

                  // perform the reset()
                  allResets.push(
                     req.retry(() => processPI.instanceReset(pi, taskID, req))
                  );
               });

               Promise.all(allResets)
                  .then(() => {
                     req.log(
                        `reset ${allResets.length} task${
                           allResets.length != 1 ? "s" : ""
                        }`
                     );
                     cb(null, allResets.length);
                  })
                  .catch((err) => {
                     AB.notify.developer(err, {
                        context: "process_manager.reset",
                        instanceID,
                        taskID,
                        req,
                     });
                     cb(err);
                  });
            });
         })
         .catch((err) => {
            req.logError("ERROR:", err);
            cb(err);
         });
   },
};
