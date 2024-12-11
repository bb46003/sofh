import { registerSheets } from "./setup/register-sheets.mjs";
import { SOFHCONFIG } from "./config.mjs";
import { registerHandlebarsHelpers } from "./setup/handlebars.mjs";
import { preloadHandlebarsTemplates } from "./setup/templates.mjs";
import { HomeScore } from "./app/home_score.mjs";
import { moveRoll } from "./dialog/move-dialog.mjs";
import { characterRelation } from "./config.mjs";
import {sofhActor} from "./actor/actors.mjs";


export default function registerSettings() {
  // -------------------
  //  INTERNAL SETTINGS
  // -------------------
  //
  const SYSTEM_ID = "SofH";
  game.settings.register(SYSTEM_ID, "points_slytherin", {
    name: "points_slytherin",
    scope: "world",
    default: 0,
    config: false,
    is_on_leed: false,
    type: Number,
  });
  game.settings.register(SYSTEM_ID, "slytherin_on_leed", {
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
  });
  game.settings.register(SYSTEM_ID, "ravenclaw_on_leed", {
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
  });
  game.settings.register(SYSTEM_ID, "hufflepuff_on_leed", {
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
  });
  game.settings.register(SYSTEM_ID, "gryffindor_on_leed", {
    name: "gryffindor_on_leed",
    scope: "world",
    default: false,
    config: false,
    type: Boolean,
  });
  game.settings.register("SofH", "showHousePoints", {
    name: "SofH.SETTINGS.showHousePoint",
    hint: "SofH.SETTINGS.showHousePointHint",
    scope: "world",
    config: true,
    default: true,
    requiresReload: true,
    type: Boolean,
  });
}

Hooks.once("init", async function () {
  console.log("Secret of Hogwarts Initialising");
  registerSheets();
  registerHandlebarsHelpers();
  registerSettings();
  loadPolishLocalization()
  CONFIG.Actor.documentClass = sofhActor;
  CONFIG.SOFHCONFIG = SOFHCONFIG;
  game.SofH = { HomeScore, moveRoll };


  return preloadHandlebarsTemplates();
});

async function loadPolishLocalization() {
  const response = await fetch('/systems/SofH/lang/pl.json');
  if (!response.ok) {
    console.error('Failed to load pl.json');
    return;
  }
  const plStrings = await response.json();
  return plStrings;
}

Hooks.once("ready", async function () {
  const SYSTEM_ID = "SofH";
  if (game.settings.get("SofH", "showHousePoints")) {
    await game.SofH.HomeScore.initialise();

    const houseSettings = [
      {
        name: "gryffindor",
        value: game.SofH.HomeScore._instance.data.points_gryffindor || 0,
      },
      {
        name: "slytherin",
        value: game.SofH.HomeScore._instance.data.points_slytherin || 0,
      },
      {
        name: "hufflepuff",
        value: game.SofH.HomeScore._instance.data.points_hufflepuff || 0,
      },
      {
        name: "ravenclaw",
        value: game.SofH.HomeScore._instance.data.points_ravenclaw || 0,
      },
    ];

    const houseWithHighestPoints = houseSettings.reduce(
      (maxHouse, currentHouse) => {
        return currentHouse.value > maxHouse.value ? currentHouse : maxHouse;
      },
      houseSettings[0],
    );
    houseSettings.forEach(async (house) => {
      if (house.name === houseWithHighestPoints.name) {
        await game.settings.set(SYSTEM_ID, `${house.name}_on_leed`, true);
      } else {
        await game.settings.set(SYSTEM_ID, `${house.name}_on_leed`, false);
      }
    });
  }
  characterRelation();
  // Check if an actor of type "clue" exists, if not, create a new one
  const allActors = game.actors;
  const isClueExist = Array.from(allActors.entries()).some(
    ([key, actor]) => actor.type === "clue"
  );

  if (!isClueExist) {
    const newActorData = {
      name: game.i18n.localize("sofh.clue"),
      type: "clue",
      ownership: {default: 3}
    };

    await Actor.create(newActorData);
    console.log("Created new clue actor: ", newActorData.name);
  }

  CONFIG.SOFHCONFIG = SOFHCONFIG;
  
});

Hooks.on("createActor", async function (actor) {
  if (actor.type === "character") {
    characterRelation();

    CONFIG.SOFHCONFIG = SOFHCONFIG;
    const characters = game.actors.filter((a) => a.type === "character");

    characters.forEach(async (character) => {
      if (character.sheet.rendered) {
        await character.sheet.render(true);
      }
    });

  }

});

Hooks.on("updateActor", (actor, updateData) => {
  if (actor.type === "character") {
    if (updateData.name) {
      Hooks.callAll("actorNameChanged");
    }
  }
});
Hooks.on("actorNameChanged", () => {
  const characters = game.actors.filter((a) => a.type === "character");

  characters.forEach(async (character) => {
    if (character.sheet.rendered) {
      await character.sheet.render(true);
    }
  });
 

});
Hooks.on("deleteActor", async function (actor) {
  if (actor.type === "character") {
    characterRelation();
    
    CONFIG.SOFHCONFIG = SOFHCONFIG;
    const characters = game.actors.filter((a) => a.type === "character");

    characters.forEach(async (character) => {
      if (character.sheet.rendered) {
        await character.sheet.render(true);
      }
    })

  }

  
});

Hooks.on('renderActorSheet', async function name(data) {
 
    const actor = data.object
    if(actor.type === "character"){
    const goal = actor.system.goal;
    const housequestion = actor.system.housequestion;
    const equipment = actor.system.equipment
    const eqArray=equipment.split('<br>')
   
    const searchKeyGoal = 'goal'; 
    const searchKeyQuestion = "question";
    const searchKeyEq = "actor";
    let updateData = {};
      let otherTrans = game.i18n._fallback?.sofh;
      if (otherTrans === undefined){
        const url = 'systems/SofH/lang/pl.json'
        const response = await fetch(url);
        const rowJason = await response.json();
        otherTrans = await nestObject(rowJason);
        otherTrans = otherTrans.sofh;
      }
       Object.entries(otherTrans.ui.actor).forEach(([key, value]) => {
        // Check if the key contains the 'searchKey' substring
        if (key.includes(searchKeyGoal)) {
          if(value === goal){
            updateData=({['system.goal']: game.i18n.localize(`sofh.ui.actor.${key}`)})
            
          }
        }
      });
  Object.entries(otherTrans.ui.actor).forEach(([key, value]) => {
  // Check if the key contains the 'searchKey' substring
  if (key.includes(searchKeyQuestion)) {
    if(value === housequestion){
      updateData=({['system.housequestion']: game.i18n.localize(`sofh.ui.actor.${key}`)})
    }
  }
})
  let transEq =""
  eqArray.forEach(item => {Object.entries(otherTrans.ui.actor).forEach(([key, value]) => {
    // Check if the key contains the 'searchKey' substring
      let searchString = item.replace(/<[^>]*>/g, '');
       if (typeof value !== 'object'){
        if(searchString !== ""){
        const regex = new RegExp(`^${searchString}`);
    
      if(regex.test(value)){
      
        transEq += game.i18n.localize(`sofh.ui.actor.${key}`);
        
     
      
      }
    }
  }
  
  })
})
if (transEq !== ""){
  let formattedStr = transEq.replace(/, /g, ",<br>");
  updateData={['system.equipment']:formattedStr}
}
  
  if(Object.keys(updateData).length !== 0){
    actor.update(updateData)
  }

  
}
  
})


async function nestObject(flatObj) {
  const nestedObj = {};

  for (const key in flatObj) {
      const keys = key.split('.');
      keys.reduce((acc, part, index) => {
          if (index === keys.length - 1) {
              acc[part] = flatObj[key];
          } else {
              acc[part] = acc[part] || {};
          }
          return acc[part];
      }, nestedObj);
  }

  return nestedObj;
}

