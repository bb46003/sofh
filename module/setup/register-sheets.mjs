import { sofhCharacterSheet } from "../actor/character.mjs";
import { sofhMovesSheet } from "../items/item.mjs";
import { SofhClue } from "../actor/clue.mjs";
import { SOFHCONFIG } from "../config.mjs";
import { sofhSpecialMovesSheet } from "../items/special-move.mjs";

export function registerSheets() {
  SOFHCONFIG.Actors =
    game.release.generation < 13
      ? Actors
      : foundry.documents.collections.Actors;
  SOFHCONFIG.ActorSheet =
    game.release.generation < 13 ? ActorSheet : foundry.appv1.sheets.ActorSheet;
  SOFHCONFIG.Items =
    game.release.generation < 13 ? Items : foundry.documents.collections.Items;
  SOFHCONFIG.ItemSheet =
    game.release.generation < 13 ? ItemSheet : foundry.appv1.sheets.ItemSheet;

  SOFHCONFIG.Actors.unregisterSheet("core", SOFHCONFIG.ActorSheet);
  SOFHCONFIG.Actors.registerSheet("sofh", sofhCharacterSheet, {
    types: ["character"],
    makeDefault: true,
  });
  SOFHCONFIG.Actors.registerSheet("sofh", SofhClue, {
    types: ["clue"],
    makeDefault: true,
  });
  const Items = foundry.documents.collections.Items;
  SOFHCONFIG.Items.unregisterSheet("core", SOFHCONFIG.ItemSheet);

  SOFHCONFIG.Items.registerSheet("sofh", sofhMovesSheet, {
    types: ["basicMoves", "comingOfAgeMoves"],
    makeDefault: true,
  });
  (SOFHCONFIG,
    Items.registerSheet("sofh", sofhSpecialMovesSheet, {
      types: ["specialPlaybookMoves", "optionalMoves", "customMoves"],
      makeDefault: true,
    }));
}
