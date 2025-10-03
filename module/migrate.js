export async function migrateWorld() {
  console.log("Migrating World to newer version");
  for (let actor of game.actors.contents) {
    try {
      let updateData = migrateActorData(actor);
      if (!foundry.utils.isEmpty(updateData)) {
        console.log(`Migrating Actor ${actor.name}`);
        const empty = { ["system.condition"]: null };
        await actor.update(empty);
        await actor.update(updateData);
      }
    } catch (err) {
      err.message = `Failed system migration for Actor ${actor.name}: ${err.message}`;
      console.error(err);
    }
    if (actor.type === "character") {
      migrateMoves(actor);
      migrateRelation(actor);
    }
  }
}

function migrateActorData(actor) {
  if (actor?.system?.condition) {
    let conditions = Object.entries(actor.system.condition);
    conditions = conditions.filter(
      ([key, value]) => value.type !== "" || value.text !== "",
    );
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
    return { ["system.condition"]: updatedConditions };
  }
}
async function migrateMoves(actor) {
  const moveTochange = await fromUuid(
    "Compendium.SofH.moves.Item.6JbqdvytBqh1EIWV",
  );
  const moveTochangeName = moveTochange.name;
  const currentMove = actor.items.find(
    (item) => item.name === moveTochangeName,
  );

  if (currentMove) {
    if (currentMove !== moveTochange) {
      await actor.updateEmbeddedDocuments("Item", [
        {
          _id: currentMove.id,
          name: moveTochangeName,
          system: moveTochange.system,
        },
      ]);
      console.log(`Replaced ${currentMove.name}`);
    }
  } else {
    console.log(moveTochange)
    await actor.createEmbeddedDocuments("Item", moveTochange);
    console.log(`Added new move: ${moveTochangeName}`);
  }
}

async function migrateRelation(actor) {
  const relation1 = actor.system.best_friend;               
  const relation2 = actor.system?.worst_enemy ?? actor.system?.worst_enemy_or_rival;
  const relation3 = actor.system.current_crush;

  if(relation1 !== ""){
   await actor.update({['system.relation1']:relation1})
  }
  if(relation2 !== ""){
     await actor.update({['system.relation2']:relation2})
  }
  if(relation3 !== ""){
     await actor.update({['system.relation3']:relation3})
  }
}
