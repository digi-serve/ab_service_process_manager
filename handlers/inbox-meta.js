/**
 * inbox_meta
 * Given a list of process ids, return a consolidated list of
 * application-processes necessary for the UI to create the Inbox accordion
 */

const ABBootstrap = require("../AppBuilder/ABBootstrap");
// {ABBootstrap}
// responsible for initializing and returning an {ABFactory} that will work
// with the current tenant for the incoming request.

function packageProcess(descApp, processes) {
   processes.forEach((p) => {
      var pobj = p.toObj();
      var pdesc = {
         id: pobj.id,
         translations: pobj.translations,
      };
      descApp.processes.push(pdesc);
   });
}

module.exports = {
   /**
    * Key: the cote message key we respond to.
    */
   key: "process_manager.inbox.meta",

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
    *    "required" : {bool},  // default = false
    *
    *    // custom:
    *        "validation" : {fn} a function(value, {allValues hash}) that
    *                       returns { error:{null || {new Error("Error Message")} }, value: {normalize(value)}}
    * }
    */
   inputValidation: {
      ids: { array: true, required: true },
   },

   /**
    * fn
    * our Request handler.
    * @param {obj} req
    *        the request object sent by the api_sails/api/controllers/process_manager/inbox_find.
    * @param {fn} cb
    *        a node style callback(err, results) to send data when job is finished
    */
   fn: async function handler(req, cb) {
      //

      req.log("in process_manager.inbox.meta");

      try {
         // get the AB for the current tenant
         let AB = await ABBootstrap.init(req);

         var ids = req.param("ids") || [];

         var allApplications = [];

         // For display to the User, we package our Process Information
         // under the Application it is registered under.
         AB.applications().forEach((app) => {
            var matchingProcesses = app.processes(
               (p) => ids.indexOf(p.id) > -1
            );
            if (matchingProcesses.length > 0) {
               var obj = app.toObj();
               var desc = {
                  id: obj.id,
                  translations: obj.translations,
                  processes: [],
               };

               packageProcess(desc, matchingProcesses);
               matchingProcesses.forEach((p) => {
                  // remove this entry from ids:
                  ids = ids.filter((i) => i != p.id);
               });

               allApplications.push(desc);
            }
         });

         // However not ALL Processes are Under an Application, so try to
         // catch those:
         // any id left in ids are those without Applications:
         if (ids.length) {
            var missingProcesses = AB.processes((p) => ids.indexOf(p.id) > -1);
            let descSystem = {
               id: "_system_",
               translations: [
                  {
                     language_code: "en",
                     label: "System",
                     description: "Internal System Process",
                  },
               ],
               processes: [],
            };

            packageProcess(descSystem, missingProcesses);
            allApplications.push(descSystem);
         }

         cb(null, allApplications);
      } catch (err) {
         req.notify.developer(err, {
            context:
               "Service:process_manager.inbox.meta: Error initializing ABFactory",
         });
         cb(err);
      }
   },
};
