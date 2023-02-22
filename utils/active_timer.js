const cron = require("node-cron");

var TIMER_POOLS = {};

var TIMER = {
   /**
    * @function isRunning
    * Return true/false if the given ABProcessTrigger.id is running.
    *
    * @param {uuid} id - the id of ABProcessTriggerTimer
    * @return {bool}
    */
   isRunning: (req, id) => {
      let tenantID = req.tenantID();

      if (
         id == null ||
         TIMER_POOLS[tenantID] == null ||
         TIMER_POOLS[tenantID][id] == null
      )
         return false;

      return true;
   },

   /**
    * @function start
    * Start the execution of the given ABProcessTriggerTimer.
    * @param {ABProcessTriggerTimer} element
    */
   start: (req, element) => {
      if (element == null || !element.isEnabled) return;

      let tenantID = req.tenantID();
      if (TIMER_POOLS[tenantID] == null) {
         TIMER_POOLS[tenantID] = {};
      }

      // Stop
      if (TIMER_POOLS[tenantID][element.id] != null) {
         TIMER.stop(req, element.id);
      }

      let cronExpression = element.getCronExpression();
      req.log(`::: START CRON job [${cronExpression}] - ${element.id}`);

      TIMER_POOLS[tenantID][element.id] = cron.schedule(cronExpression, () => {
         // start the processs task
         req.log(
            `::: TRIGGER CRON job [${cronExpression}] - ${element.id} - ${element.triggerKey}`
         );

         req.serviceRequest(
            "process_manager.trigger",
            {
               key: element.triggerKey,
               data: {},
            },
            (err) => {
               if (err) {
                  return req.notify.developer(err, {
                     context: "failed process trigger",
                     id: element.id,
                     key: element.triggerKey,
                  });
               }
               req.log("Timer Started");
            }
         );
      });
   },

   /**
    * @function stop
    * Stop the execution of the given ABProcessTriggerTimer.
    * @param {uuid} elementId - the id of ABProcessTriggerTimer
    */
   stop: (req, elementId) => {
      let tenantID = req.tenantID();

      if (
         elementId == null ||
         TIMER_POOLS[tenantID] == null ||
         TIMER_POOLS[tenantID][elementId] == null
      )
         return;

      req.log(`::: Stop CRON job - ${elementId}`);
      TIMER_POOLS[tenantID][elementId].stop();
      delete TIMER_POOLS[tenantID][elementId];
   },
};

module.exports = TIMER;
