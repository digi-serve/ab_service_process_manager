//
// process_manager
// (AppBuilder) a micro service to manage our process tasks
//
const AB = require("@digiserve/ab-utils");

var controller = AB.controller("process_manager");

// controller.afterStartup((req, cb) => {
controller.afterStartup(async (req, cb) => {
   let listeners = [];
   var tenants;

   try {
      tenants = await req.serviceRequest("tenant_manager.config.list", {});

      tenants.forEach((t) => {
         let tReq = controller.requestObj({
            jobID: "process_manager.onstartup()",
            tenantID: t.uuid,
         });
         listeners.push(
            tReq.serviceRequest("process_manager.initialize_timer", {})
         );
      });

      await Promise.all(listeners);
      cb();
   } catch (err) {
      req.notify.developer(err, {
         context: "process_manager.onstartup()",
         tenants,
      });
      return cb(err);
   }
});
// controller.beforeShutdown((cb)=>{ return cb(/* err */) });

controller.waitForDB = true;
// {bool} wait for mysql to be accessible before .init() is processed

controller.init();

process.on("unhandledRejection", (reason /*, promise */) => {
   console.error(reason);
   console.error(reason.stack);
});
