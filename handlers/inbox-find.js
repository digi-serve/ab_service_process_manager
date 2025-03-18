/**
 * inbox_find
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
   key: "process_manager.inbox.find",

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
      users: { array: true, required: true },
      roles: { array: true, optional: true },
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

      req.log("in process_manager.inbox.find");

      // get the AB for the current tenant
      const AB = await ABBootstrap.init(req);

      try {
         const users = req.param("users") || [];
         const roles = req.param("roles") || [];

         if (users.length === 0 && roles.length === 0) {
            // this isn't right:
            req.log("Error: no user or role provided in query.");

            const invalidInputError = new Error(
               "Invalid Inputs. Provide either a user or a role."
            );

            cb(invalidInputError);

            return;
         }

         // build our condition
         const cond = { status: "pending" };

         if (users.length) cond.or = [{ users }];
         if (roles.length) {
            cond.or = cond.or || [];
            cond.or.push({ roles });
         }

         try {
            const list = await req.retry(() =>
               AB.objectProcessForm().model().find(cond, req)
            );

            if (list) {
               const parsedList = [];

               // make sure the .ui field is sent back as an object:
               for (const l of list) {
                  if (l.ui && typeof l.ui === "string") {
                     try {
                        l.ui = JSON.parse(l.ui);
                     } catch (e) {
                        let msg = `Error: UserForm[${l.uuid}].ui is not valid JSON `;
                        req.log(msg);
                        req.log(e);
                        req.notify.builder(e, {
                           context: msg,
                           uuid: l.uuid,
                           ui: l.ui,
                        });
                     }
                  }

                  if (l.options && typeof l.options === "string") {
                     try {
                        l.data = JSON.parse(l.options);
                     } catch (e) {
                        let msg = `Error: UserForm[${l.uuid}].options is not valid JSON `;
                        req.log(msg);
                        req.log(e);
                        req.notify.builder(e, {
                           context: msg,
                           uuid: l.uuid,
                           options: l.options,
                        });
                     }
                  }

                  if (!l.scopeQuery) {
                     parsedList.push(l);

                     continue;
                  }

                  try {
                     if (typeof l.scopeQuery === "string")
                        l.scopeQuery = JSON.parse(l.scopeQuery);
                  } catch (e) {
                     let msg = `Error: UserForm[${l.uuid}].scopeQuery is not valid JSON `;
                     req.log(msg);
                     req.log(e);
                     req.notify.builder(e, {
                        context: msg,
                        uuid: l.uuid,
                        scopeQuery: l.scopeQuery,
                     });
                  }

                  try {
                     const dataProcessInstance = (
                        await req.retry(() =>
                           AB.objectProcessInstance()
                              .model()
                              .find({ uuid: l.process }, req)
                        )
                     )[0];

                     // The purpose of this function is to examine the logic of the "filterConditions.glue" parameter,
                     // which may be set to either "and" or "or",
                     // and then return a function that is dependent on this setting.
                     const getFunctionParseBoolean = (glue) =>
                        glue === "and" ? (a, b) => a && b : (a, b) => a || b;

                     // The purpose of this function is to receive several input parameters,
                     // including an "ObjectQuery" instance called "query", as well as "field" and "alias2Obj".
                     // Based on these inputs,
                     // the function will return an array of objects that include values for "username", "columnName", and row data.
                     const getDataQueries = async (query, field, alias2Obj) =>
                        await Promise.all(
                           users.map(async (u) => {
                              const user = { username: u };
                              const data = await req.retry(() =>
                                 query.model().findAll({}, user, req)
                              );

                              return Object.assign({}, user, {
                                 data: data.map((dq) => {
                                    return {
                                       columnName: field.columnName,
                                       value: dq[
                                          `${alias2Obj}.${field.columnName}`
                                       ],
                                    };
                                 }),
                              });
                           })
                        );

                     // The main goal of this function is to compare the output of the "getDataQueries" function
                     // to the input data contained in a "ProcessInstance" that was triggered.
                     // Based on this comparison, the function will return a boolean value,
                     // indicating whether the data matches the predefined criteria or not.
                     const isThereDataQuery = (dataQueries) => {
                        for (const dq of dataQueries)
                           return dq.data.find(
                              (d) =>
                                 dataProcessInstance.context.input[
                                    d.columnName
                                 ] == d.value
                           )
                              ? true
                              : false;
                     };

                     let field = null;
                     let alias2Obj = null;

                     // The main objective of this function is to parse the "scopeQuery" data
                     // within the "ProcessForm" to determine which information should be made available to the user
                     // and which information should be restricted. Once the data has been analyzed,
                     // the function will return a boolean value,
                     // indicating whether the user has access to the data or not.
                     const parseScopeQuery = async (filterConditions) => {
                        if (!filterConditions) return true;

                        if (!filterConditions.glue) return true;

                        if (!filterConditions.rules.length) return true;

                        const isCorrectProcessForm = (
                           await Promise.all(
                              filterConditions.rules.map(async (rule) => {
                                 if (rule.glue)
                                    return await parseScopeQuery(rule);
                                 else {
                                    // rule.value for in_query_field is [queryID]:[fieldID]
                                    const queryID = rule.value.split(":")[0];
                                    const query = AB.queryByID(queryID);
                                    const objects = query.objectIDs.map((id) =>
                                       AB.objectByID(id)
                                    );

                                    for (const obj of objects) {
                                       field = obj.fieldByID(rule.key);

                                       if (field) {
                                          for (const key in query.alias2Obj)
                                             if (
                                                query.alias2Obj[key] === obj.id
                                             ) {
                                                alias2Obj = key;

                                                break;
                                             }

                                          break;
                                       }
                                    }

                                    switch (rule.rule) {
                                       case "in_query":
                                       case "in_query_field":
                                          return isThereDataQuery(
                                             await getDataQueries(
                                                query,
                                                field,
                                                alias2Obj
                                             )
                                          );

                                       case "not_in_query":
                                       case "not_in_query_field":
                                          return !isThereDataQuery(
                                             await getDataQueries(
                                                query,
                                                field,
                                                alias2Obj
                                             )
                                          );

                                       default:
                                          return false;
                                    }
                                 }
                              })
                           )
                        ).reduce(
                           getFunctionParseBoolean(filterConditions.glue)
                        );

                        return isCorrectProcessForm;
                     };

                     if (await parseScopeQuery(l.scopeQuery))
                        parsedList.push(l);
                  } catch (err) {
                     let msg = `Error: UserForm[${l.uuid}].scopeQuery could not be parsed`;
                     req.log(msg);
                     req.log(err);
                     req.notify.builder(err, {
                        context: msg,
                        uuid: l.uuid,
                        scopeQuery: l.scopeQuery,
                     });
                  }
               }

               cb(null, parsedList);

               return;
            }

            cb(null, null);
         } catch (err) {
            req.notify.developer(err, {
               context: "process_manager.inbox.find",
               users,
               roles,
            });
            cb(err);
         }
      } catch (err) {
         req.notify.developer(err, {
            context:
               "Service:process_manager.inbox.find: Error initializing ABFactory",
         });
         cb(err);
      }
   },
};
