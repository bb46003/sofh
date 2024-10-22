export const preloadHandlebarsTemplates = async function(){
    return loadTemplates([
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
        "systems/SofH/templates/tab/partial/relation-ravenclaw.hbs"



    ])
}