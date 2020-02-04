//
// process_manager
// (AppBuilder) a micro service to manage our process tasks
//
const AB = require("ab-utils");

var controller = AB.controller("process_manager");
// controller.afterStartup((cb)=>{ return cb(/* err */) });
// controller.beforeShutdown((cb)=>{ return cb(/* err */) });
controller.init();
