export function registerHandlebarsHelpers() {
  Handlebars.registerHelper({
    eq: (v1, v2) => v1 === v2,
    ne: (v1, v2) => v1 !== v2,
    lt: (v1, v2) => v1 < v2,
    gt: (v1, v2) => v1 > v2,
    lte: (v1, v2) => v1 <= v2,
    gte: (v1, v2) => v1 >= v2,
    and() {
      return Array.prototype.every.call(arguments, Boolean);
    },
    or() {
      return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
    },
  });
  Handlebars.registerHelper("ifCondition", function (condition) {
    const conditionArray = Object.values(condition);
    const anycondition = conditionArray.some(
      (element) => element.type !== "" && element.name !== "",
    );
    return anycondition;
  });

  Handlebars.registerHelper("log", function (element) {
    console.log(element);
  });
  Handlebars.registerHelper("checkIfOnLead", async function (leadVar, options) {
    return leadVar ? "" : "display:none";
  });

  Handlebars.registerHelper("lowercase", function (str) {
    return str.toLowerCase();
  });

  Handlebars.registerHelper(
    "checkRelation",
    function (characterRelation, actor, ID) {
      const filteredRelations = {};

      for (let [id, name] of Object.entries(characterRelation)) {
        if (name !== actor.name) {
          filteredRelations[id] = game.actors.get(id).name;
        }

        for (let j = 1; j < 5; j++) {
          if (j !== ID) {
            if (id === actor.system.relation[`name${j}`]) {
              delete filteredRelations[id];
              break;
            } else if (name !== actor.name) {
              filteredRelations[id] = game.actors.get(id).name;
            }
          }
        }
      }

      return filteredRelations;
    },
  );

  Handlebars.registerHelper("selectRelevantRelation", function (thisCharacter) {
    const actors = game.actors;
    const character = Array.from(actors.entries()).filter(
      ([key, actor]) => actor.type === "character",
    );

    let characterWithRelationtoMe = {};
    const myCharacterID = thisCharacter._id;
    character.forEach(([key, actor]) => {
      for (let i = 1; i < 5; i++) {
        let relationID = actor.system.relation[`name${i}`];
        let relationName = actor.name;
        if (relationID === myCharacterID) {
          let j = Object.keys(characterWithRelationtoMe).length;
          characterWithRelationtoMe[
            `${actor.system.relation[`value${i}`]}` + `:${j}`
          ] = relationName;
        }
      }
    });
    return characterWithRelationtoMe;
  });

  Handlebars.registerHelper("injectHtml", function (htmlContent) {
    // Wrap content in a styled div with IM Fell English as the font
    const styledContent = `<div style="font-family: 'IM Fell English', serif;">${htmlContent}</div>`;
    return new Handlebars.SafeString(styledContent);
  });

  Handlebars.registerHelper("addCharacters", function (actor) {
    const characters = actor.system.actorID;
    let html = ``;
    Object.keys(characters).forEach((actorId) => {
      if (actorId !== "0") {
        const name = characters[actorId].name;
        const actor = game.actors.get(actorId);
        const cluerelatedMoves = actor?.items.filter(
          (move) => move.system.cluerelated === true,
        );
        const theorize = cluerelatedMoves[0];
        if (theorize === undefined) {
          html += `<th class="actor-known-clue" id="${actorId}">${name}<p>${game.i18n.localize("Character")} ${game.i18n.localize("sofh.ui.lack_of_move")}</p></th>`;
        } else {
          html += `
    <th class="actor-known-clue" id="${actorId}">
      <div class="actor-clue-headr">
        <div class="clue-header-name">${name}</div>
        <div class="clue-move-button">
        <h3 class="clue-line"></h3>
          <button class="theorize-move-roll" id="${theorize._id}">${theorize.name}</button>
        </div>
      </div>
    </th>`;
        }
      }
    });

    return html;
  });

  Handlebars.registerHelper("addCharactersKnownsClue", function (index, actor) {
    if (!actor || !actor.system || !actor.system.actorID) {
      return ""; // Return an empty string if data is missing
    }

    const characters = actor.system.actorID;
    let html = ``;

    // Iterate over each actor ID and create the input HTML
    Object.keys(characters).forEach((actorId) => {
      const name = characters[actorId].name;
      const isChecked = characters[actorId][`have${index}`] ? "checked" : "";

      html += `<th class="actor-known-clue"><input type="checkbox" class="circle-checkbox-condition" name="system.actorID.${actorId}.have${index}" ${isChecked} /></th>`;
    });

    // Return the generated HTML as a SafeString
    return new Handlebars.SafeString(html);
  });

  Handlebars.registerHelper("showAllKnownClue", function (clueID, complexity) {
    if (Array.isArray(clueID)) {
      let clueNames = [];
      clueID.forEach((ID) => clueNames.push(game.actors.get(ID).name));

      let selectElement = document.createElement("select");
      selectElement.classList.add("selection-mistery");
      let blankOption = document.createElement("option");
      blankOption.value = "";
      blankOption.textContent = "";
      selectElement.appendChild(blankOption);
      clueNames.forEach((name, index) => {
        let optionElement = document.createElement("option");
        optionElement.value = name;
        optionElement.textContent = name;
        optionElement.id = clueID[index];
        selectElement.appendChild(optionElement);
      });

      let html = `<div class="clue-slector">
                <label class="known-clue">${game.i18n.localize("sofh.dialog.knownMisery")}</label>`;
      html += selectElement.outerHTML;
      html += `</div>`;

      return new Handlebars.SafeString(html);
    } else {
      const actor = this.actor;
      const actorId = actor._id;
      let html = "";
      const clueSheet = game.actors.get(clueID);
      const clueDescription = clueSheet.system.clue;
      const actorClue = clueSheet.system.actorID[actorId];
      Object.keys(actorClue).forEach((key) => {
        if (key.startsWith("have") && actorClue[key] === true) {
          const index = key.slice(4);
          if (clueDescription.hasOwnProperty(index)) {
            html += ` 
            <div class="single-clue">
              <label class="known-clue-label">${clueDescription[index].description}</label>
              <input type="checkbox" class="circle-checkbox-isapply-clue"></input>
            </div>`;
          }
        }
      });
      if (html !== "") {
        html += `
        <div class="complexity">
          <label class="complexity-label">${game.i18n.localize("sofh.ui.complexity_value")}</label>
          <input type="number" class="complexity-numer" value="${complexity}"></input>
        </div>`;
      }
      return new Handlebars.SafeString(html);
    }
  });

  Handlebars.registerHelper("numberOfQuestion", function (data) {
    const numberOfQuestion = Object.keys(data.question).length;
    if (numberOfQuestion > 2) {
      return true;
    } else {
      return false;
    }
  });

  Handlebars.registerHelper("chekSolution", function () {
    const User = game.user.isGM;

    if (User) {
      return true;
    } else {
      const solutions = this.actor.system.solutions;
      const areShowToPlayer = solutions
        ? Object.values(solutions).some((item) => item.showToPlayer === true)
        : false;

      if (areShowToPlayer) {
        return true;
      } else {
        return false;
      }
    }
  });

  Handlebars.registerHelper("showSingleSolution", function (solution) {
    const User = game.user.isGM;

    if (User) {
      return true;
    } else {
      const areShowToPlayer = solution.showToPlayer;
      if (areShowToPlayer) {
        return true;
      } else {
        return false;
      }
    }
  });

  Handlebars.registerHelper("isGM", function () {
    const User = game.user.isGM;

    if (User) {
      return true;
    } else {
      return false;
    }
  });

  Handlebars.registerHelper("addTheretizeButton", function () {
    const User = game.user;
    if (User.isGM) {
    } else {
      let html = ``;
      const actor = game.user.character;
      const cluerelatedMoves = actor?.items.filter(
        (move) => move.system.cluerelated === true,
      );
      const theorize = cluerelatedMoves[0];
      if (theorize === undefined) {
        html += `<th class="actor-known-clue" id="${actor._id}">${name}<p>${game.i18n.localize("Character")} ${game.i18n.localize("sofh.ui.lack_of_move")}</p></th>`;
      } else {
        html += `
    <button class="theorize-solution-roll" id="${theorize._id}">${theorize.name}</button>
        `;
      }
      return html;
    }
  });

  Handlebars.registerHelper("customIDStyle", function () {
    const userID = game.user.id;
    const right = game.settings.get("SofH", "HomeScorePositionX");
    const bottom = game.settings.get("SofH", "HomeScorePositionY");
    const scale = game.settings.get("SofH", "HomeScoreSize");
    // Define the unique CSS for this userID
    let css = `
    .house-scores-container-${userID} {
      display: flex;
      align-items: center;
      justify-content: space-evenly;
      width: 900px;
      transform: scale(${scale});
      position: absolute;
      margin: 5px;
      bottom: ${bottom}px !important;
      right: ${right}px !important;
    }
  `;

    // Check if the style element already exists for this userID
    const styleId = `custom-css-${userID}`;
    if (!document.getElementById(styleId)) {
      // Create and append a new style element to the document head
      const styleElement = document.createElement("style");
      styleElement.id = styleId;
      styleElement.type = "text/css";
      styleElement.appendChild(document.createTextNode(css));
      document.head.appendChild(styleElement);
    }

    // Return the HTML with the unique class
    const html = `<div class="house-scores-container-${userID}">`;
    return html;
  });

  Handlebars.registerHelper("calcMinHeight", function (strings) {
    const numberOfStrings = Object.keys(strings).length;
    let minHeight;
    if (numberOfStrings === 0) {
      minHeight = 120;
    } else {
      minHeight = 120 + 40 * numberOfStrings;
    }
    return minHeight;
  });

  Handlebars.registerHelper("haveAdvantages", function (advantages) {
    const advanatage = Object.keys(advantages).length;
    if (advanatage > 0) {
      return true;
    } else {
      return false;
    }
  });
  Handlebars.registerHelper("checkPulltheStrings", function (data) {
    const items = data.items;
    let buttonPullStrings = "";
    items.forEach((item) => {
      if (
        item.name === game.i18n.localize("soft.move.namePulltheStrings") ||
        item.name === "Pull the Strings"
      ) {
        buttonPullStrings = `
          <button class="send-to-chat-moves-btn" id="${item._id}" style="">
            <i class="fas fa-comments" id="${item._id}"></i>
          </button>`;
      }
    });
    return new Handlebars.SafeString(buttonPullStrings);
  });

  Handlebars.registerHelper("checkPulltheStringsCSS", function (data) {
    const items = data.items;
    let css = "";
    items.forEach((item) => {
      if (
        item.name === game.i18n.localize("soft.move.namePulltheStrings") ||
        item.name === "Pull the Strings"
      ) {
        css = `four`;
      }
    });
    return css;
  });
  Handlebars.registerHelper(
    "checkReputation",
    function (checkReputation, index) {
      if (
        Number(checkReputation[0]) === index ||
        Number(checkReputation[1]) === index
      ) {
        return "checked";
      }
      if (
        Number(checkReputation[0]) !== undefined &&
        Number(checkReputation[1]) !== undefined
      ) {
        return "disabled";
      }
    },
  );
  Handlebars.registerHelper("getActorName", function (id) {
    if (id !== "") {
      const actor = game.actors.get(id);
      const actorName = actor.name;
      return actorName;
    }
  });

  Handlebars.registerHelper("allItems", function () {
    return CONFIG.SOFHCONFIG.allItems;
  });

  Handlebars.registerHelper("areRelatedMoves", function (relatedMoves) {
    if (relatedMoves.length > 0) {
      return true;
    } else {
      return false;
    }
  });

  Handlebars.registerHelper("allTopic", function () {
    return {
      ...CONFIG.SOFHCONFIG.favoriteTopic,
      ...CONFIG.SOFHCONFIG.favoriteTopic2,
    };
  });

  Handlebars.registerHelper("includesElement", function (element) {
    if (!element || typeof element !== "object") return false;
    if (element?.name && element?.id) {
      return true;
    } else {
      return false;
    }
  });
}
