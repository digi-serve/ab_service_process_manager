/*
 * process_manager
 */
const AB = require("@digiserve/ab-utils");
const env = AB.defaults.env;

module.exports = {
   process_manager: {
      /*************************************************************************/
      /* enable: {bool} is this service active?                                */
      /*************************************************************************/
      enable: env("PROCESS_MANAGER_ENABLE", true),
   },

   /**
    * datastores:
    * Sails style DB connection settings
    */
   datastores: AB.defaults.datastores(),
};
