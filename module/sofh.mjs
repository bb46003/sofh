import { registerSheets } from "./setup/register-sheets.mjs";
import { SOFHCONFIG } from "./config.mjs";
import { registerHandlebarsHelpers } from "./setup/handlebars.mjs";
import { preloadHandlebarsTemplates } from "./setup/templates.mjs";
import { HomeScore } from "./app/home_score.mjs";
import { moveRoll } from "./dialog/move-dialog.mjs";
import { characterRelation } from "./config.mjs";
import { sofhActor } from "./actor/actors.mjs";
import * as SofHMigrate from "./migrate.js";
import { customHouse } from "./setup/customHouse.mjs";

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
    name: "sofh.SETTINGS.showHousePoint",
    hint: "sofh.SETTINGS.showHousePointHint",
    scope: "world",
    config: true,
    default: true,
    requiresReload: true,
    type: Boolean,
  });
  // Most recent data format version
  game.settings.register("SofH", "systemMigrationVersion", {
    config: false,
    scope: "world",
    type: String,
    default: "",
  });
  if (game.settings.get("SofH", "showHousePoints")) {
    game.settings.register("SofH", "HomeScoreSize", {
      name: "sofh.SETTINGS.homeScoreSize",
      hint: "sofh.SETTINGS.homeScoreSizeHnt",
      scope: "client",
      config: true,
      requiresReload: false,
      type: Number,
      default: 0.45,
      onChange: (newValue) => {
        const type = "HomeScoreSize";
        customStyle(type, newValue); // Automatically called whenever the value changes
      },
    });
    game.settings.register("SofH", "HomeScorePositionY", {
      name: "sofh.SETTINGS.HomeScorePositionY",
      hint: "sofh.SETTINGS.HomeScorePositionYHint",
      scope: "client",
      config: true,
      requiresReload: false,
      type: Number,
      default: -150,
      onChange: (newValue) => {
        const type = "HomeScorePositionY";
        customStyle(type, newValue); // Automatically called whenever the value changes
      },
    });
    game.settings.register("SofH", "HomeScorePositionX", {
      name: "sofh.SETTINGS.HomeScorePositionX",
      hint: "sofh.SETTINGS.HomeScorePositionXHint",
      scope: "client",
      config: true,
      requiresReload: false,
      type: Number,
      default: 70,
      onChange: (newValue) => {
        const type = "HomeScorePositionX";
        customStyle(type, newValue); // Automatically called whenever the value changes
      },
    });
  }
  game.settings.register("SofH", "customConfig", {
    name: "Custom Config",
    hint: "Add or override blood types, houses, and equipment.",
    scope: "world",
    config: false, // hidden from default settings UI
    type: Object,
    default: {},
  });
  game.settings.registerMenu("SofH", "customConfigMenu", {
    name: "Custom Config Menu",
    label: "Edit Custom Config",
    hint: "Define custom blood types, houses, and house equipment.",
    type: customHouse, // FormApplication subclass (see below)
    restricted: true,
  });
}

Hooks.once("init", async function () {
  console.log("Secret of Hogwarts Initialising");

  registerSheets();
  registerHandlebarsHelpers();
  registerSettings();
  loadPolishLocalization();

  CONFIG.Actor.documentClass = sofhActor;
 CONFIG.SOFHCONFIG = SOFHCONFIG;
  // --- Load previously saved custom config ---
  const savedData = game.settings.get("SofH", "customConfig");
  if (savedData) {
    // Merge blood types
    if (savedData.bloodTypes?.length) {
      savedData.bloodTypes.forEach((blood, i) => {
        const key = `bloodType${i + 1}`;
        SOFHCONFIG.bloodType[key] = blood;
      });
    }

    // Merge houses
    if (savedData.houses?.length) {
      savedData.houses.forEach((house) => {
        if (!house.name) return;
        const key = house.name.toLowerCase().replace(/\s+/g, "_");

        // Merge house name
        SOFHCONFIG.House[key] = house.name;

        // Merge house-specific equipment
        if (!SOFHCONFIG.houseeq[key]) SOFHCONFIG.houseeq[key] = {};
        house.houseEq?.forEach((eq) => {
          if (eq)
            SOFHCONFIG.houseeq[key][eq.toLowerCase().replace(/\s+/g, "_")] = eq;
        });

        // Merge general equipment
        if (house.equipment) SOFHCONFIG.equipment[key] = house.equipment;
        CONFIG.SOFHCONFIG.goal["goal"+key] = house.goal;
        CONFIG.SOFHCONFIG.timeToShine[key+"TimeToShine"] = house.timeToShine;
      });
    }
    if (savedData.topicReplace) {
      CONFIG.SOFHCONFIG.favoriteTopic = {};
      CONFIG.SOFHCONFIG.favoriteTopic2 = {};
    }

    const topic1 = savedData?.topic1;
    if (topic1 !== undefined && topic1?.length > 0) {
      topic1.forEach((topic, i) => {
        const key = `topic-${i + 1}`;
        CONFIG.SOFHCONFIG.favoriteTopic[key] = topic;
      });
    }

    const topic2 = savedData?.topic2;
    if (topic2 !== undefined && topic2?.length > 0) {
      topic2.forEach((topic, i) => {
        const key = `topic-${i + 1}`;
        CONFIG.SOFHCONFIG.favoriteTopic2[key] = topic;
      });
    }

    // Assign merged config to global CONFIG
   

    game.SofH = {
      HomeScore,
      moveRoll,
      migrateWorld: SofHMigrate.migrateWorld,
    };

    return preloadHandlebarsTemplates();
  }
});

async function loadPolishLocalization() {
  const response = await fetch("/systems/SofH/lang/pl.json");
  if (!response.ok) {
    console.error("Failed to load pl.json");
    return;
  }
  const plStrings = await response.json();
  return plStrings;
}
Hooks.on("updateSetting", (setting) => {
  if (
    ["HomeScorePositionX", "HomeScorePositionY", "HomeScoreSize"].includes(
      setting.key,
    )
  ) {
    customStyle();
  }
});

Hooks.once("ready", async function () {
  const SYSTEM_ID = "SofH";
  if (game.settings.get("SofH", "showHousePoints")) {
    await HomeScore.initialise();

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
    ([key, actor]) => actor.type === "clue",
  );

  if (!isClueExist) {
    const newActorData = {
      name: game.i18n.localize("sofh.clue"),
      type: "clue",
      ownership: { default: 3 },
    };

    await Actor.create(newActorData);
    console.log("Created new clue actor: ", newActorData.name);
  }

  CONFIG.SOFHCONFIG = SOFHCONFIG;

  // Migration
  if (game.user.isGM) {
    const SYSTEM_MIGRATION_VERSION = game.world.systemVersion;
    const currentVersion = game.settings.get("SofH", "systemMigrationVersion");
    const needsMigration =
      !currentVersion ||
      foundry.utils.isNewerVersion(SYSTEM_MIGRATION_VERSION, currentVersion);

    if (needsMigration) {
      SofHMigrate.migrateWorld();
      game.settings.set(
        "SofH",
        "systemMigrationVersion",
        SYSTEM_MIGRATION_VERSION,
      );
    }
  }
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
    });
  }
});

Hooks.on("renderActorSheet", async function name(data) {
  const actor = data.object;
  const isGM = game.user.isGM;
  const lang = game.i18n.lang;
  let flagsLang = actor.flags?.SofH?.lang;
  if (flagsLang === undefined) {
    actor.setFlag("SofH", "lang", lang);
    flagsLang = lang;
  }

  if (actor.type === "character" && !isGM && flagsLang !== lang) {
    const goal = actor.system.goal;
    const housequestion = actor.system.housequestion;
    const equipment = actor.system.equipment;
    const eqArray = equipment.split("<br>");

    const searchKeyGoal = "goal";
    const searchKeyQuestion = "question";
    const searchKeyEq = "actor";
    let updateData = {};
    let otherTrans = game.i18n._fallback?.sofh;
    if (otherTrans === undefined) {
      const url = "systems/SofH/lang/pl.json";
      const response = await fetch(url);
      const rowJason = await response.json();
      otherTrans = await nestObject(rowJason);
      otherTrans = otherTrans.sofh;
    }
    Object.entries(otherTrans.ui.actor).forEach(([key, value]) => {
      // Check if the key contains the 'searchKey' substring
      if (key.includes(searchKeyGoal)) {
        if (value === goal) {
          updateData = {
            ["system.goal"]: game.i18n.localize(`sofh.ui.actor.${key}`),
          };
        }
      }
    });
    Object.entries(otherTrans.ui.actor).forEach(([key, value]) => {
      // Check if the key contains the 'searchKey' substring
      if (key.includes(searchKeyQuestion)) {
        if (value === housequestion) {
          updateData = {
            ["system.housequestion"]: game.i18n.localize(
              `sofh.ui.actor.${key}`,
            ),
          };
        }
      }
    });
    let transEq = "";
    eqArray.forEach((item) => {
      Object.entries(otherTrans.ui.actor).forEach(([key, value]) => {
        // Check if the key contains the 'searchKey' substring
        let searchString = item.replace(/<[^>]*>/g, "");
        if (typeof value !== "object") {
          if (searchString !== "") {
            const regex = new RegExp(`^${searchString}`);

            if (regex.test(value)) {
              transEq += game.i18n.localize(`sofh.ui.actor.${key}`);
            }
          }
        }
      });
    });
    if (transEq !== "") {
      let formattedStr = transEq.replace(/, /g, ",<br>");
      updateData = { ["system.equipment"]: formattedStr };
    }

    if (Object.keys(updateData).length !== 0) {
      actor.update(updateData);
    }
  }
});

Hooks.on("preCreateScene", (scene) => {
  scene.updateSource({
    tokenVision: false,
    fog: {
      exploration: false,
    },
    grid: {
      type: CONST.GRID_TYPES.GRIDLESS,
    },
  });
});

async function nestObject(flatObj) {
  const nestedObj = {};

  for (const key in flatObj) {
    const keys = key.split(".");
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

async function customStyle(type, newValue) {
  const userID = game.user.id;

  // Find or create the <style> element
  let styleTag = document.getElementById(`dynamic-styles-${userID}`);
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = `dynamic-styles-${userID}`;
    document.head.appendChild(styleTag);
  }

  // Get updated settings
  let right = game.settings.get("SofH", "HomeScorePositionX");
  let bottom = game.settings.get("SofH", "HomeScorePositionY");
  let scale = game.settings.get("SofH", "HomeScoreSize");
  switch (type) {
    case "HomeScorePositionX":
      right = newValue;
      break;
    case "HomeScorePositionY":
      bottom = newValue;
      break;
    case "HomeScoreSize":
      scale = newValue;
      break;
  }
  // Update the style content
  styleTag.textContent = `
    .house-scores-container-${userID} {
      display: flex;
      align-items: center;
      justify-content: space-evenly;
      width: 900px;
      transform: scale(${scale}) !important;
      position: absolute;
      margin: 5px;
      bottom: ${bottom}px !important;
      right: ${right}px !important;
    }
  `;
}
