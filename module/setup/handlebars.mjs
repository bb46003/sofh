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
  Handlebars.registerHelper("trigerlist", function (actor) {
    // Ensure the actor and items exist
    if (!actor || !actor.items) return "";

    const items = actor.items;
    if (items.size !== 0) {
      const itemsArray = items._source;
      let htmlOutput = "";

      // Function to remove all HTML tags
      const stripHtmlTags = (html) => {
        return html.replace(/<[^>]*>/g, ""); // Remove all HTML tags
      };

      // Iterate through each item
      itemsArray.forEach((item) => {
        let triggers = item.system.triggers; // Assuming system.triggers is available
        const descriptionText = stripHtmlTags(item.system.description); // Clean description text
        const tooltipAttribute = `data-tooltip="${descriptionText}" data-tooltip-direction="RIGHT" style="width: fit-content"`;
        triggers = triggers.replace(/<p(.*?)>/g, `<p ${tooltipAttribute}>`);

        if (triggers && triggers.length > 0) {
          if (item.system.isrolled) {
            htmlOutput += `<a class="roll-moves-btn" id="${item._id}">${triggers}</a>`;
          } else {
            htmlOutput += `<a class="moves-description-open" id="${item._id}">${triggers}</a>`;
          }
        }
      });

      return htmlOutput; // Return safe HTML string
    }
  });

  Handlebars.registerHelper("checkIfOnLead", async function (leadVar, options) {
    return leadVar ? "" : "display:none";
  });
}
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
        characterWithRelationtoMe[actor.system.relation[`value${i}`]] =
          relationName;
      }
    }
  });
  return characterWithRelationtoMe;
});
Handlebars.registerHelper("injectHtml", function (htmlContent) {
  // Use SafeString to render raw HTML without escaping
  return new Handlebars.SafeString(htmlContent);
});
