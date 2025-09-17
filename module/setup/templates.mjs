export const preloadHandlebarsTemplates = async function () {
   const templatePaths = [
    "systems/SofH/templates/tab/relations.hbs",
    "systems/SofH/templates/tab/equipment.hbs",
    "systems/SofH/templates/tab/partial/dimond-button.hbs",
    "systems/SofH/templates/tab/character-characteristic.hbs",
    "systems/SofH/templates/tab/strings.hbs",
    "systems/SofH/templates/tab/character-moves.hbs",
    "systems/SofH/templates/tab/partial/moves-question.hbs",
    "systems/SofH/templates/tab/partial/moves-body.hbs",
    "systems/SofH/templates/tab/partial/moves-body-limited.hbs",
    "systems/SofH/templates/tab/partial/move-title.hbs",
    "systems/SofH/templates/tab/partial/relation-slytherin.hbs",
    "systems/SofH/templates/tab/partial/relation-griffindor.hbs",
    "systems/SofH/templates/tab/partial/relation-hufflepuff.hbs",
    "systems/SofH/templates/tab/partial/relation-ravenclaw.hbs",
    "systems/SofH/templates/tab/party-list.hbs",
    "systems/SofH/templates/tab/clue-list.hbs",
    "systems/SofH/templates/tab/mistery-solve-list.hbs",
    "systems/SofH/templates/app/part/custom-house.hbs",
    "systems/SofH/templates/app/part/custom-blood-type.hbs",
    
  ];

  if (game.release.generation < 13) {
    return loadTemplates(templatePaths);
}
return foundry.applications.handlebars.loadTemplates(templatePaths);
};
