const cron = require("node-cron");

var TIMER_POOLS = {};

module.exports = {


    start: (req, element) => {
        if (element == null) return;

        let tenantID = req.tenantID();
        if (TIMER_POOLS[tenantID] == null) {
            TIMER_POOLS[tenantID] = {};
        }

        // Stop
        if (TIMER_POOLS[tenantID][element.id] != null) {
            this.stop(req, element.id);
        }

        let cronExpression = element.getCronExpression();
        req.log(`::: START CRON job [${cronExpression}] - ${element.id}`);

        TIMER_POOLS[tenantID][element.id] = cron.schedule(cronExpression, () => {
            // start the processs task
            req.log(
                `::: TRIGGER CRON job [${cronExpression}] - ${element.id} - ${element.triggerKey}`
            );

            req.serviceRequest("process_manager.trigger", {
                key: element.triggerKey,
                data: {}
            }, () => {
                req.log("Timer started");
            });
        });
    },

    /**
* @function stop
*
* @param {uuid} elementId - the id of ABProcessTriggerTimer
*/
    stop: (req, elementId) => {
        let tenantID = req.tenantID();

        if (elementId == null || TIMER_POOLS[tenantID] == null || TIMER_POOLS[tenantID][elementId] == null) return;

        req.log(`::: Stop CRON job - ${elementId}`);
        TIMER_POOLS[tenantID][elementId].stop();
        delete TIMER_POOLS[tenantID][elementId];
    }
}