import { moveRoll } from "../dialog/move-dialog.mjs";

export class SofhClue extends ActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sofh"],
      template: "systems/SofH/templates/clue.hbs",
      width: 800,
      height: 960,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "clue-list",
        },
      ],
      
    });
  }

  
  async getData() {
    const context = super.getData();
    const actorData = this.actor.toObject(false);
    context.system = actorData.system;

 
    return context;
  }

  async activateListeners(html) {
    super.activateListeners(html);
    html.on("click", ".add-clue", this.addClue.bind(this));
    html.on("click",".remove-clue", this.removeClue.bind(this))
    html.on("click",".theorize-move-roll", this.rollForTheorize.bind(this))
    html.on("click",".solution-add", this.addSolution.bind(this))
    html.on("click",".remove-solution", this.removeSolution.bind(this))
    html.on("click",".theorize-solution-roll", this.solutionRollForTheorize.bind(this))
  


    html.find('.character-sheet').on("dragover", this._onDragOver.bind(this));
    html.find('.character-sheet').on("dragleave", this._onDragLeave.bind(this));
    html.find('.character-sheet').on("drop", this._onDrop.bind(this));
    html.find(`.remove-single-party-member`).on("click", this.removePartyMember.bind(this))
    html.find(`.add-character`).on("click", this.addPartyMember.bind(this))

}

_onDragOver(event) {
    event.preventDefault(); // Necessary for the drop event to trigger
    // Optionally, you can add a class to show some visual feedback
    event.currentTarget.classList.add('drag-over');
}
_onDragLeave(event) {
    // Remove the visual feedback when the drag leaves the area
    event.currentTarget.classList.remove('drag-over');
}
_onDrop(event) {
    event.preventDefault();
    
    // Get the data from the drop event, which could be a dragged object like an item or a character
    const data = event.dataTransfer;
    if (data) {
      const droppedItem = JSON.parse(data.getData("text/plain"));  // Assuming plain text data is being dropped

      const droppedType = droppedItem.type;
      if (droppedType === "Actor") {  // Ensure 'Actor' is the correct type, not 'character'
          const droppedActor = game.actors.get(droppedItem.uuid.split(".")[1]);
          if(droppedActor.type === 'character'){
            let updateData={};
            updateData[`system.actorID.${droppedActor._id}`]={"name":droppedActor.name, "img":droppedActor.img}

            this.actor.update(updateData)
            // This will print the actor ID
          }
      }
        }
        // Handle the dropped item here, for example, add it to the character sheet
    

    // Remove any visual feedback after the drop
    event.currentTarget.classList.remove('drag-over');
}  
async addClue(event) { 

    event.preventDefault();
    
    const clues = this.actor.system.clue;
  
   
    
    let clueNumbers = 0;
    if (clues && typeof clues === 'object') {
      clueNumbers = Object.keys(clues).length;
    }
    let updateData={};
    

    
    updateData[`system.clue.${clueNumbers}.description`] = " ";
    
    const actorID = this.actor.system.actorID;
    
    for (const actorId in actorID) {
      if (actorID.hasOwnProperty(actorId)) { 
        
        updateData[`system.actorID.${actorId}.have${clueNumbers}`] = false;
        
      }
    }
    


    this.actor.update(updateData)
    this.actor.render(true);
    
}
async removeClue(ev){
 
    const button = ev.target;
    const ID = Number(button.id);
    let clue = this.actor.system.clue;
 
        const newClue = { ...clue };
        console.log(newClue[ID])
        delete newClue[ID];   
       
    
    
   

    const actorsId = this.actor.system.actorID;
    if (actorsId && typeof actorsId === 'object') {
        for (const actorId in actorsId) {
            if (actorsId[actorId].hasOwnProperty(`have${ID}`)) {
                delete actorsId[actorId][`have${ID}`];  // Remove the specific property
            }
        }
        await this.actor.update({ 
          "system.actorID": [{}],
          "system.clue":[{}]
          
         });
        await this.actor.update({ 
          "system.actorID": actorsId,
          "system.clue":newClue
          
         });
    
    }
  
    
}
async removePartyMember(event) {
    event.preventDefault();
    const target = event.target.id;
    const actor = this.actor;
    let partyMembers = actor.system.actorID;
    if (partyMembers.hasOwnProperty(target)) {
        delete partyMembers[target]; 
    }
    const updateData = partyMembers;
    await actor.update({ 'system.actorID': [{}]});
   
    await actor.update({ 'system.actorID': updateData});
 
  
    await actor.render(true);
}
async addPartyMember(event) {
  const actors = game.actors.filter(actor => actor.type === "character");
  const currentMember = this.actor.system.actorID;
  const filteredActors = actors.filter(actor => !Object.keys(currentMember).includes(actor.id));
  const html = await renderTemplate("systems/SofH/templates/dialogs/add-patry-member.hbs", { actors: filteredActors});
  
  new Dialog({
      title: game.i18n.localize("sofh.ui.clue.add-party-member"),
      content: html,
      buttons: {
          add: {
              label: game.i18n.localize("EFFECT.MODE_ADD"),
              callback: async () => {
                  await this.addMembets(html)
              }
          }
      },
      default: "Add",
  }).render(true, {width:200});
  
}
async addMembets(event){
 
  const containers = document.querySelectorAll('.party-memeber-add');
   
    const clue = this.actor;
    const currentClues = clue.system?.clue ? Object.keys(clue.system.clue).length : 0;
    let updateData = {};
    containers.forEach(async container => {
        
        const checkbox = container.querySelector('input[type="checkbox"]');
        
    
        if (checkbox && checkbox.checked) {
       
            let newMember = game.actors.get(container.id);
            updateData = {
              [container.id]: {
                  "name": newMember.name,
                  "img": newMember.img
              }
             
          };
          
          for (let i = 0; i < currentClues; i++) {
        
            updateData[container.id] = {
                ...updateData[container.id],  
                [`have${i}`]: false
            };
        }
        this.addOwnership(container.id)
       
            }
            await clue.update({
              'system.actorID': updateData,
             });
             
    });
         
    await clue.render(true)
}

async addOwnership(characterID){
  const users = Array.from(game.users.values());
  const filteredUsers = users.filter(user => 
    user.role !== 4 && user?.character?.id === characterID
);
const filteredUser = filteredUsers[0];
const actor = this.actor;
await actor.update({ [`ownership.${filteredUser._id}`]: 3 });


}

async rollForTheorize(event){
    event.preventDefault();
    const user = game.user._id;
    const actor = game.actors.get(event.target.offsetParent.id)
    const ownership = actor.ownership
    const hasAccess = ownership[user] === 3;

    if(hasAccess){
    const item = actor.items.filter(move => move.id === event.target.id)[0];  
    const dialogInstance = new moveRoll(actor, item, this.actor.id);
    dialogInstance.rollForMove(actor, item, this.actor.id);
    }
    else{
      ui.notifications.warn(game.i18n.localize("sofh.ui.war.you_are_not_owner"))
    }
}
async addSolution(event){
  if(game.user.isGM){
  const clue = this.actor;
  const solutions = clue.system.solutions;
  let solutionsNumbers = 0;
  if (solutions && typeof solutions === 'object') {
    solutionsNumbers = Object.keys(solutions).length;
  }
  let updateData={}; 
  updateData[`system.solutions.${solutionsNumbers}.solution`] = "";
  updateData[`system.solutions.${solutionsNumbers}.question`] = "";
  updateData[`system.solutions.${solutionsNumbers}.complexity`] = 0;
  updateData[`system.solutions.${solutionsNumbers}.showToPlayer`] = false
  
  await clue.update(updateData)  
}
}

async removeSolution(ev){
  ev.preventDefault();
  if(game.user.isGM){
  const target = ev.target.id;
  const actor = this.actor;
  let allSolution = actor.system.solutions;
  if (allSolution.hasOwnProperty(target)) {
      delete allSolution[target]; 
  }
  const updateData = allSolution;
  await actor.update({ 'system.solutions': [{}]});
 
  await actor.update({ 'system.solutions': updateData});


  await actor.render(true);}
}



async solutionRollForTheorize(ev){
  ev.preventDefault();
  const user = game.user._id;
  const actor = game.user.character;
  const ownership = actor.ownership
  const hasAccess = ownership[user] === 3;
  const solutionGroup = event.target.closest('.solution-group');  
  const complexityInput = solutionGroup.querySelector('.complexity');
  const complexity = complexityInput ? parseFloat(complexityInput.value) : undefined


  if(hasAccess){
  const item = actor.items.filter(move => move.id === ev.target.id)[0];  
  const dialogInstance = new moveRoll(actor, item, this.actor.id);
  dialogInstance.rollForMove(actor, item, this.actor.id, complexity);
  }
  else{
    ui.notifications.warn(game.i18n.localize("sofh.ui.war.you_are_not_owner"))
  }
}

}