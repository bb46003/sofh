export async function migrateWorld() {
    console.log("Migrating World to newer version");

    
    // Migrate World Actors
    for (let actor of game.actors.contents) {
        try {
          let updateData = migrateActorData(actor);
          if (!foundry.utils.isEmpty(updateData)) {
            console.log(`Migrating Actor ${actor.name}`);
            const empty = {["system.condition"]: null }
           await actor.update(empty);
           await actor.update(updateData);
          }
        } catch (err) {
          err.message = `Failed system migration for Actor ${actor.name}: ${err.message}`;
          console.error(err);
        }
        if(actor.type === "character"){
            migrateMoves(actor);
        }
          
        
    
        }
}



function migrateActorData(actor) {
    
    // migrate from 7 condidtion to 5
    if (actor?.system?.condition) {
        let conditions = Object.entries(actor.system.condition);
        conditions = conditions.filter(([key, value]) => value.type !== "" || value.text !== "");
        if (conditions.length > 5) {
            conditions = conditions.slice(0, 5);
        }
        const updatedConditions = {};
        conditions.forEach(([key, value], index) => {
            updatedConditions[index + 1] = value;
        });
        for (let i = conditions.length + 1; i <= 5; i++) {
            updatedConditions[i] = { type: "", text: "", fixed: false };
        }
       
        return  {["system.condition"]: updatedConditions }
    }
    

}
async function migrateMoves(actor) {
    // Fetch the move to change from the compendium
    const moveTochange = await fromUuid("Compendium.SofH.moves.Item.6JbqdvytBqh1EIWV");
    const moveTochangeName = moveTochange.name;

    // Find the current move in the actor's items
    const currentMove = actor.items.find(item => item.name === moveTochangeName);
 
    // If the current move exists, replace it with the new move
    if (currentMove) {
        // Update the actor's items to replace the old move
        await actor.updateEmbeddedDocuments("Item", [{
            _id: currentMove.id, // Target the specific item to update
            name: moveTochangeName, // Update its name or any other properties if needed
            system: moveTochange.system // Copy over data (assuming moveTochange has data property)
        }]);
        console.log(`Replaced ${currentMove.name}`);
    } else {
        // If the move doesn't exist, you can add it as a new item
        await actor.createEmbeddedDocuments("Item",moveTochange);
        console.log(`Added new move: ${moveTochangeName}`);
    }
}
  
