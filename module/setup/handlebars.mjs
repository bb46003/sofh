

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
  // Wrap content in a styled div with IM Fell English as the font
  const styledContent = `<div style="font-family: 'IM Fell English', serif;">${htmlContent}</div>`;
  return new Handlebars.SafeString(styledContent);
});

Handlebars.registerHelper("addCharacters",function(actor){

  const characters = actor.system.actorID;
  let html=``;
  Object.keys(characters).forEach((actorId) => {
    if(actorId !== "0"){
    const name = characters[actorId].name;
    const actor = game.actors.get(actorId);
    const culerelatedMoves = actor?.items.filter(move => move.system.culerelated === true);
    const theorize = culerelatedMoves[0];
   if(theorize === undefined){
    html += `<th class="actor-known-clue" id="${actorId}">${name}<p>${game.i18n.localize("Character")} ${game.i18n.localize("sofh.ui.lack_of_move")}</p></th>`;
   }
   else{
    html += `
    <th class="actor-known-clue" id="${actorId}">
      <div class="actor-clue-headr">
        <div class="clue-header-name">${name}</div>
        <div class="cule-move-button">
        <h3 class="clue-line"></h3>
          <button class="theorize-move-roll" id="${theorize._id}">${theorize.name}</button>
        </div>
      </div>
    </th>`;
   }
  }
  });
  

return html

})

Handlebars.registerHelper("addCharactersKnownsClue", function (index, actor) {
  if (!actor || !actor.system || !actor.system.actorID) {
    return ''; // Return an empty string if data is missing
  }

  const characters = actor.system.actorID;
  let html = ``;

  // Iterate over each actor ID and create the input HTML
  Object.keys(characters).forEach((actorId) => {
    const name = characters[actorId].name;
    const isChecked = characters[actorId][`have${index}`] ? 'checked' : '';
    
    html += `<th class="actor-known-clue"><input type="checkbox" class="circle-checkbox-condition" name="system.actorID.${actorId}.have${index}" ${isChecked} /></th>`;
  });

  // Return the generated HTML as a SafeString
  return new Handlebars.SafeString(html);
});

Handlebars.registerHelper("showAllKnownClue", function (clueID) {
  if (Array.isArray(clueID)) {
let clueNames= [];
clueID.forEach(ID =>
  clueNames.push(game.actors.get(ID).name)
)

let selectElement = document.createElement('select'); 
selectElement.classList.add('selection-mistery');
let blankOption = document.createElement('option');
blankOption.value = ''; 
blankOption.textContent = ''; 
selectElement.appendChild(blankOption); 
clueNames.forEach((name, index) => {
  let optionElement = document.createElement('option'); 
  optionElement.value = name; 
  optionElement.textContent = name; 
  optionElement.id = clueID[index]
  selectElement.appendChild(optionElement); 
});
return new Handlebars.SafeString(selectElement.outerHTML);
  }
  else{
    const actor = this.actor;
  const actorId = actor._id; 
  let html = "";  
  const clueSheet = game.actors.get(clueID)
  const clueDescription = clueSheet.system.clue;
  const actorClue = clueSheet.system.actorID[actorId];
  Object.keys(actorClue).forEach(key => {
  if (key.startsWith('have') && actorClue[key] === true) {
    const index = key.slice(4); 
    if (clueDescription.hasOwnProperty(index)) {
      html += ` 
        <div class="single-clue">
          <label class="known-clue-label">${clueDescription[index].description}</label>
          <input type="checkbox" class="circle-checkbox-isapply-clue">
        </div>`
    }
  }
});
if (html !== ""){
  html += `
    <div class="complexity">
      <label class="complexity-label">${game.i18n.localize("sofh.ui.complexity_value")}</label>
      <input type="number" class="complexity-numer"></input>
    </div>
  `

}
return new Handlebars.SafeString(html);

  }
 
})

Handlebars.registerHelper("numberOfQuestion", function(data){
  const numberOfQuestion = Object.keys(data.question).length;
  if(numberOfQuestion > 2){
    return true
  }
  else{
    return false
  }
})

Handlebars.registerHelper("chekSolution", function(){
  const User = game.user.isGM;
  if(User){
    return true
  }
  else{
    return false
  }
})



