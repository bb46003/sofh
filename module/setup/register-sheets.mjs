import { sofhCharacterSheet } from "../actor/character.mjs";
import { sofhMovesSheet } from "../items/item.mjs";

export function registerSheets() {
  Actors.unregisterSheet("core", ActorSheet);

  Actors.registerSheet("sofh", sofhCharacterSheet, {
    types: ["character"],
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
