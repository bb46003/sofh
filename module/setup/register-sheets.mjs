import { sofhCharacterSheet } from "../actor/character.mjs";
import { sofhMovesSheet } from "../items/item.mjs";
import { SofhClue } from "../actor/clue.mjs"

export function registerSheets() {
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("sofh", sofhCharacterSheet, {
    types: ["character"],
    makeDefault: true,
  });
  Actors.registerSheet("sofh", SofhClue, {
    types: ["clue"],
    makeDefault: true,
  });

  Items.unregisterSheet("core", ItemSheet);

  Items.registerSheet("sofh", sofhMovesSheet, {
    types: [
      "basicMoves",
      "houseMoves",
      "peripheralMoves",
      "endOfSessionMoves",
      "specialPlaybookMoves",
    ],
    makeDefault: true,
  });
}
