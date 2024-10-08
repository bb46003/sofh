import { registerSheets } from "./setup/register-sheets.mjs";
import {SOFHCONFIG} from "./config.mjs";
import { registerHandlebarsHelpers } from "./setup/handlebars.mjs";
import { preloadHandlebarsTemplates } from "./setup/templates.mjs";


Hooks.once('init', async function () {
    console.log("Secret of Hogwarts Initialising")
    registerSheets()
    registerHandlebarsHelpers();
    CONFIG.SOFHCONFIG = SOFHCONFIG;
   
    return preloadHandlebarsTemplates();
})

