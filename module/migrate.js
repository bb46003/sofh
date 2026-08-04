export async function migrateWorld() {
  console.log("Migrating World to newer version");

  // --- Load compendium basic moves once ---
  const basicMovesPack = game.packs.find(
    (pack) => pack.collection === "SofH.moves"
  );

  if (!basicMovesPack) {
    console.warn("SofH.moves compendium not found");
    return;
  }

  const items = await basicMovesPack.getDocuments();
  const basicMoves = items.filter((item) => item.type === "basicMoves");

  // This MUST be let
  let moveChange = false;

  // --- Actor migration loop ---
  for (let actor of game.actors.contents) {
    try {
      const updateData = migrateActorData(actor);

      if (!foundry.utils.isEmpty(updateData)) {
        const empty = { ["system.condition"]: null };
        await actor.update(empty);
        await actor.update(updateData);
      }
    } catch (err) {
      err.message = `Failed system migration for Actor ${actor.name}: ${err.message}`;
      console.error(err);
    }

    // --- Compare actor moves with compendium moves ---
    if (actor.type === "character") {
      const actorMoves = actor.items.filter(
        (item) => item.type === "basicMoves"
      );

      for (const actorMove of actorMoves) {
        // Prefer stable sourceId match
        const sourceId = actorMove.flags?.core?.sourceId;

        let baseMove = null;

        if (sourceId) {
          baseMove = basicMoves.find((m) => m.uuid === sourceId);
        }

        // Fallback to name match
        if (!baseMove) {
          baseMove = basicMoves.find((m) => m.name === actorMove.name);
        }

        if (!baseMove) continue;

        const sameSystem =  foundry.utils.objectsEqual(actorMove.system,baseMove.system)
        if (!sameSystem) {
          console.log(
            `Move difference detected: ${actor.name} → ${actorMove.name}`
          );
          moveChange = true;
          break;
        }
      }

      migrateRelation(actor);
    }
  }

  // --- Ask for move migration only if needed ---
  if (moveChange) {
    const moveMigration = new foundry.applications.api.DialogV2({
      window: {
        title: game.i18n.localize("sofh.moveMigration"),
      },
      content: `<div class=migration-dialog>${game.i18n.localize("sofh.migrationApprove")}</div>`,
      buttons: [
        {
          action: "yes",
          label: game.i18n.localize("Yes"),
          callback: async () => {
            const actors = game.actors.contents.filter(actor => { return actor.type === "character";});

            await migrateMoves(actors,basicMoves);
          },
        },
        {
          action: "no",
          label: game.i18n.localize("No"),
        }
      ],
    });

    moveMigration.render(true);
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
async function migrateMoves(actors, basicMoves) {
  for (const actor of actors) {
    if (actor.type !== "character") continue;

    const actorMoves = actor.items.filter(
      (item) => item.type === "basicMoves"
    );
    for (const actorMove of actorMoves) {
      const sourceId = actorMove.flags?.SofH?.compendiumSource;
      const updateMove = basicMoves.filter(move =>{return ((move.uuid === sourceId)||(move.name === actorMove.name))})[0]
      await actorMove.update({['system']:updateMove.system})
      actorMove.setFlag("SofH", "compendiumSource", updateMove.uuid)
    }
    
  }
}


async function migrateRelation(actor) {
  const relation1 = actor.system.best_friend;
  const relation2 =
    actor.system?.worst_enemy ?? actor.system?.worst_enemy_or_rival;
  const relation3 = actor.system.current_crush;

  if (relation1 !== "") {
    await actor.update({ ["system.relation1"]: relation1 });
  }
  if (relation2 !== "") {
    await actor.update({ ["system.relation2"]: relation2 });
  }
  if (relation3 !== "") {
    await actor.update({ ["system.relation3"]: relation3 });
  }
}
