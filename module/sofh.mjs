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
import { EndSessionDialog } from "./dialog/end-session.mjs";
import SocketHandler from "./setup/socket-handler.mjs";
import MOVES from "./items/default-item-function.mjs";
import SpecialMovesDataModel from "./datamodel/special-move-datamodel.mjs";
const fields = foundry.data.fields;

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
    type: new fields.NumberField({ initial: 0 }),
  });
  game.settings.register(SYSTEM_ID, "slytherin_on_leed", {
    name: "slytherin_on_leed",
    scope: "world",
    config: false,
    type: new fields.BooleanField({ initial: false }),
  });
  game.settings.register(SYSTEM_ID, "points_ravenclaw", {
    name: "points_ravenclaw",
    scope: "world",
    default: 0,
    config: false,
    is_on_leed: false,
    type: new fields.NumberField({ initial: 0 }),
  });
  game.settings.register(SYSTEM_ID, "ravenclaw_on_leed", {
    name: "ravenclaw_on_leed",
    scope: "world",
    default: false,
    config: false,
    type: new fields.BooleanField({ initial: false }),
  });
  game.settings.register(SYSTEM_ID, "points_hufflepuff", {
    name: "points_hufflepuff",
    scope: "world",
    default: 0,
    config: false,
    is_on_leed: false,
    type: new fields.NumberField({ initial: 0 }),
  });
  game.settings.register(SYSTEM_ID, "hufflepuff_on_leed", {
    name: "hufflepuff_on_leed",
    scope: "world",
    default: false,
    config: false,
    type: new fields.BooleanField({ initial: false }),
  });
  game.settings.register(SYSTEM_ID, "points_gryffindor", {
    name: "points_gryffindor",
    scope: "world",
    default: 0,
    config: false,
    type: new fields.NumberField({ initial: 0 }),
  });
  game.settings.register(SYSTEM_ID, "gryffindor_on_leed", {
    name: "gryffindor_on_leed",
    scope: "world",
    default: false,
    config: false,
    type: new fields.BooleanField({ initial: false }),
  });
  game.settings.register("SofH", "showHousePoints", {
    name: "sofh.SETTINGS.showHousePoint",
    hint: "sofh.SETTINGS.showHousePointHint",
    scope: "world",
    config: true,
    default: true,
    requiresReload: true,
    type: new fields.BooleanField({ initial: false }),
  });
  // Most recent data format version
  game.settings.register("SofH", "systemMigrationVersion", {
    config: false,
    scope: "world",
    type: new fields.StringField({ initial: "" }),
  });
  if (game.settings.get("SofH", "showHousePoints")) {
    game.settings.register("SofH", "HomeScoreSize", {
      scope: "client",
      config: false,
      requiresReload: false,
      type: new fields.NumberField({ initial: 0.45 }),
      
    });
    game.settings.register("SofH", "HomeScorePositionY", {
      scope: "client",
      config: false,
      requiresReload: false,
      type: new fields.NumberField({ initial: -150 }),
    });
    game.settings.register("SofH", "HomeScorePositionX", {
      scope: "client",
      config: false,
      requiresReload: false,
      type: new fields.NumberField({ initial: 70 }),
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
  CONFIG.Item.documentClass = MOVES;
  CONFIG.Actor.documentClass = sofhActor;
  CONFIG.SOFHCONFIG = SOFHCONFIG;
  CONFIG.Item.dataModels = { specialPlaybookMoves: SpecialMovesDataModel };
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
        CONFIG.SOFHCONFIG.goal["goal" + key] = house.goal;
        CONFIG.SOFHCONFIG.timeToShine[key + "TimeToShine"] = house.timeToShine;
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
      EndSessionDialog,
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
    // customStyle();
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
    const macroKey = "sofh.move.endSesionMove";
    const allLangs = game.system.languages.map((l) => l.lang);
    const localizedNames = [];

    // cache translations so we don't re-fetch next time
    if (!game.sofhLangCache) game.sofhLangCache = {};

    for (const langDef of game.system.languages) {
      if (!langDef?.path) continue;

      try {
        if (!game.sofhLangCache[langDef.lang]) {
          const response = await fetch(langDef.path);
          game.sofhLangCache[langDef.lang] = await response.json();
        }

        const translationSet = await game.sofhLangCache[langDef.lang];
        const localized = await foundry.utils.getProperty(
          translationSet,
          macroKey,
        );
        if (localized) localizedNames.push(localized);
      } catch (err) {
        console.warn(`Failed to load translations for ${langDef.lang}:`, err);
      }
    }

    // find GM users
    const gmUsers = game.users.filter((u) => u.isGM);
    const gmMacros = game.macros.filter((m) =>
      gmUsers.some((u) => m.ownership[u.id] === 3 || m.ownership.default === 3),
    );

    // find any GM macro whose name matches any localized name
    let macro = gmMacros.find((m) => localizedNames.includes(m.name));

    if (!macro) {
      // fallback name in current language
      const macroName = game.i18n.localize(macroKey);

      macro = await Macro.create({
        name: macroName,
        type: "script",
        img: "icons/svg/door-open-outline.svg",
        command: "new game.SofH.EndSessionDialog().render(true);",
      });

      // assign to first empty slot
      const hotbarMacros = game.user.getHotbarMacros();
      const emptySlot = hotbarMacros.findIndex((h) => !h.macro);

      if (emptySlot === -1) {
        console.warn("No empty hotbar slot available for End Session macro!");
      } else {
        await game.user.assignHotbarMacro(macro, emptySlot + 1);
      }
    }
  }
  const myPackage = game.system;
  myPackage.socketHandler = new SocketHandler();
  const worldItems = await game.items.filter((i) => i.type === "basicMoves");
  const basicMovesPack = await game.packs.get("SofH.moves");
  const packItems = await basicMovesPack.getDocuments();
  const allItems = [...worldItems, ...packItems];
  const names = allItems.map((i) => i.name);
  const namesObject = Object.fromEntries(names.map((name) => [name, name]));
  CONFIG.SOFHCONFIG.allItems = namesObject;
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
Hooks.on("renderChatMessageHTML", async (message, html) => {
  const unUsedRiseButton = html.querySelectorAll(".rise-with-move");
  const buttons = html.querySelectorAll(".roll-breakthrough");

  buttons.forEach((button) => {
    button.addEventListener("click", async (ev) => {
      const action = ev.currentTarget.dataset.action;
      const pack = game.packs.get("SofH.random-table");

      let rollTable;
      if (action === "up") {
        rollTable = await pack.getDocument("wzX0mwmH6SEWCT8l"); // Up table
      } else {
        rollTable = await pack.getDocument("ky6qfFM0IqONlFkb"); // Down table
      }

      if (rollTable) {
        const result = await rollTable.roll();
        rollTable.toMessage(result.results);
      } else {
        ui.notifications.error("Roll table not found.");
      }
    });
  });
  const actor = await game.actors.get(message.system.actor);
  const reladedMoves = message?.system.unUsedRise;
  const coreMove = actor?.items.get(message.system.move);
  let resultTier = message?.system.resultTier;
  unUsedRiseButton.forEach((button) => {
    button.addEventListener("click", async (ev) => {
      const id = button.dataset.id;
      const reladedMove = await actor.items.get(reladedMoves[id]);
      const riseBelow7To7to9 =
        reladedMove.system.action.riseRollResults["7to9"];
      const rise7to9ToAbove10 =
        reladedMove.system.action.riseRollResults.above10;
      const riseAbove10ToAbove12 =
        reladedMove.system.action.riseRollResults.above12;
      if (riseBelow7To7to9 && resultTier === "below7") {
        resultTier = "7to9";
      } else if (rise7to9ToAbove10 && resultTier === "7to9") {
        resultTier = "above10";
      } else if (
        riseAbove10ToAbove12 &&
        resultTier === "above10" &&
        coreMove.system?.above12
      ) {
        resultTier = "above12";
      }
      const newResults = coreMove.system[resultTier];
      const roll = Roll.fromData(message.system.roll);
      let flavor =
        `<p>${game.i18n.format("sofh.ui.chat.relatedMoveRiseEffect", { name: reladedMove.name })}` +
        message.system.flavor;

      const buttonRegex = new RegExp(
        `<button\\s+class="rise-with-move"\\s+data-id="${id}".*?<\\/button>`,
        "s",
      );

      const rollResultsRegex = /<div class="roll-results">([\s\S]*?)<\/div>/g;
      flavor = flavor.replace(
        rollResultsRegex,
        `<div class="roll-results">${newResults}</div>`,
      );
      flavor = flavor.replace(buttonRegex, "");
      const complication = checkComplication(
        reladedMoves[id],
        message.system.actor,
      );

      if (complication) {
        flavor +=
          "<br>" +
          game.i18n.format("sofh.ui.chat.relatedMoveCauseComplication", {
            name: reladedMove.name,
          }) +
          "<br>";
      }
      roll.toMessage({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: flavor,
      });
    });
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
async function checkComplication(moveID, actor) {
  const move = actor.items.get(moveID);
  const flag = move.flags?.SofH?.complication;

  if (flag === undefined) {
    move.setFlag("SofH", "complication.usedtime", new Date());
    move.setFlag("SofH", "complication.useNumber", 1);
    return false;
  } else {
    const delta = new Date() - new Date(flag);
    const useCount = flag.useNumber + 1;
    const twelveHours = 5 * 60 * 60 * 1000;
    move.setFlag("SofH", "complication.useNumber", useCount);
    if (
      delta < twelveHours &&
      useCount === move.system.action.riseRollResults.useNumber
    ) {
      return true;
    } else if (delta > twelveHours) {
      move.setFlag("SofH", "complication.usedtime", new Date());
      move.setFlag("SofH", "complication.useNumber", 1);
    }
    return false;
  }
}
