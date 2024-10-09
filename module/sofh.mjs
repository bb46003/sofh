import { registerSheets } from "./setup/register-sheets.mjs";
import {SOFHCONFIG} from "./config.mjs";
import { registerHandlebarsHelpers } from "./setup/handlebars.mjs";
import { preloadHandlebarsTemplates } from "./setup/templates.mjs";
import { HomeScore } from "./app/home_score.mjs";

export default function registerSettings() {
	// -------------------
	//  INTERNAL SETTINGS
	// -------------------
	//
  const SYSTEM_ID = "sofh";
	game.settings.register(SYSTEM_ID, "points_slytherin", {
		name: "points_slytherin",
		scope: "world",
		default: 0,
    config: false,
    is_on_leed: false,
		type: Number,
	})
  game.settings.register(SYSTEM_ID, "slytherin_on_leed",{
    name: "slytherin_on_leed",
		scope: "world",
		default: false,
    config: false,
		type: Boolean,
  });
  game.settings.register(SYSTEM_ID, "points_ravenclaw", {
		name: "points_ravenclaw",
		scope: "world",
		default: 0,
    config: false,
    is_on_leed: false,
		type: Number,
	})
  game.settings.register(SYSTEM_ID, "ravenclaw_on_leed",{
    name: "ravenclaw_on_leed",
		scope: "world",
		default: false,
    config: false,
		type: Boolean,
  });
  game.settings.register(SYSTEM_ID, "points_hufflepuff", {
		name: "points_hufflepuff",
		scope: "world",
		default: 0,
    config: false,
    is_on_leed: false,
		type: Number,
	})
  game.settings.register(SYSTEM_ID, "hufflepuff_on_leed",{
    name: "hufflepuff_on_leed",
		scope: "world",
		default: false,
    config: false,
		type: Boolean,
  });
  game.settings.register(SYSTEM_ID, "points_gryffindor", {
		name: "points_gryffindor",
		scope: "world",
		default: 0,
    config: false,
		type: Number,
	})
  game.settings.register(SYSTEM_ID, "gryffindor_on_leed",{
    name: "gryffindor_on_leed",
		scope: "world",
		default: false,
    config: false,
		type: Boolean,
  }
);
game.settings.register("SofH", "showHousePoints", {
    name: "sofh.SETTINGS.showHousePoint",
    hint: "sofh.SETTINGS.showHousePointHint",
    scope: "world",
    config: true,
    default: true,
    requiresReload: true,
    type: Boolean
});



}

Hooks.once('init', async function () {
    console.log("Secret of Hogwarts Initialising")
    registerSheets()
    registerHandlebarsHelpers();
    registerSettings();
    CONFIG.SOFHCONFIG = SOFHCONFIG;
    game.sofh = {HomeScore}
   
    return preloadHandlebarsTemplates();
})

Hooks.once("ready", async function() {
    const SYSTEM_ID = "sofh";
    if(game.settings.get("SofH", "showHousePoints")){
     await game.sofh.HomeScore.initialise()
    
          const houseSettings = [
              { name: "gryffindor", value: game.sofh.HomeScore._instance.data.points_gryffindor || 0 },
              { name: "slytherin", value: game.sofh.HomeScore._instance.data.points_slytherin ||0 },
              { name: "hufflepuff", value: game.sofh.HomeScore._instance.data.points_hufflepuff || 0 },
              { name: "ravenclaw", value: game.sofh.HomeScore._instance.data.points_ravenclaw || 0 }
          ];
      
          const houseWithHighestPoints = houseSettings.reduce((maxHouse, currentHouse) => {
            return (currentHouse.value > maxHouse.value) ? currentHouse : maxHouse;
        }, houseSettings[0]);
              houseSettings.forEach(async house =>{
            if (house.name === houseWithHighestPoints.name) {
             await game.settings.set(SYSTEM_ID, `${house.name}_on_leed`, true);
            }
            else {
             await game.settings.set(SYSTEM_ID, `${house.name}_on_leed`, false);
            }        
          })
          
    }
          // Hide all images with class 'imgflag'
         
    })