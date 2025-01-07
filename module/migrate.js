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

  
