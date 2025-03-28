/**
 * userform.update
 * our Request handler.
 */
const ABBootstrap = require("../AppBuilder/ABBootstrap");
// {ABBootstrap}
// responsible for initializing and returning an {ABFactory} that will work
// with the current tenant for the incoming request.

module.exports = {
    /**
     * Key: the cote message key we respond to.
     */
    key: "process_manager.userform.update",

    inputValidation: {
        processID: { string: { uuid: true }, required: true },
        taskID: { string: { uuid: true }, required: true },
        instanceID: { required: true },
        values: { required: true },
    },

    /**
     * fn
     * our Request handler.
     * @param {obj} req
     *        the request object sent by the api_sails/api/controllers/process_manager/userform.update.
     * @param {fn} cb
     *        a node style callback(err, results) to send data when job is finished
     */
    fn: async function handler(req, cb) {
        // get the AB for the current tenant
        const AB = await ABBootstrap.init(req);

        // gather the jobData for this request:
        const data = {
            processID: req.param("processID"),
            taskID: req.param("taskID"),
            instanceID: req.param("instanceID"),
            values: req.param("values"),
        };

        const process = AB.processByID(data.processID);
        const task = process?.elements((t) => t.id == data.taskID)?.[0];
        const instance = (await AB.objectProcessInstance()
            .model()
            .find({ uuid: data.instanceID }, req))[0];

        // set input values to state of the task
        task.enterInputs(instance, data.values);

        // continue in the process
        process.run(instance, null, req);

        cb(null, true);
    }
};
