//
// process_manager
// (AppBuilder) a micro service to manage our process tasks
//
const AB = require("ab-utils");

var controller = AB.controller("process_manager");

// controller.afterStartup((req, cb) => {
controller.afterStartup((req, cb) => {
   let listeners = [];

   req.serviceRequest("tenant_manager.config.list", {}, (err, tenants) => {
      if (err) return cb(err);

      tenants.forEach((t) => {
         let tReq = controller.requestObj({
            jobID: "process_manager.onstartup()",
            tenantID: t.uuid,
         });
         listeners.push(
            new Promise((resolve, reject) => {
               tReq.serviceRequest(
                  "process_manager.initialize_timer",
                  {},
                  (err) => {
                     err ? reject(err) : resolve();
                  }
               );
            })
         );
      });

      Promise.all(listeners)
         .then(() => cb())
         .catch((error) => {
            req.notify.developer(error, {
               context: "process_manager.onstartup()",
               tanents: tenants,
            });
            cb(error);
         });
   });
});
// controller.beforeShutdown((cb)=>{ return cb(/* err */) });

controller.waitForDB = true;
// {bool} wait for mysql to be accessible before .init() is processed

controller.init();
