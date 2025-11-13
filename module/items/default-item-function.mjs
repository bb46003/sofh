const BaseItem = foundry.documents?.Item ?? foundry.documents?.BaseItem;

export default class MOVES extends Item {
  /* -------------------------------------------- */
  /*  Item Attributes                             */
  /* -------------------------------------------- */
  constructor(...args) {
    super(...args);
  }

  async zmianaDanych(event, name, index, name2, element) {
    const target = event.target;
    const newValue = target.value;
    const updates = {};

    if (element === "name") {
      updates["name"] = newValue;
    } else if (
      (element.includes("system.action") && element.includes("isUse")) ||
      element.includes("isHouseRelated") ||
      element.includes("relationRelated") ||
      element.includes("stringRelated") ||
      element.includes("culeRelated")
    ) {
      updates[element] = target.checked;
    } else if (
      element.includes("resultsChange") ||
      element.includes("triggers") ||
      element.includes("description")
    ) {
      updates[element] = newValue;
    } else if (target.id === "related-move") {
      const relatedMoves = foundry.utils.deepClone(this.system.relatedMoves);
      const id = Number(target.dataset.id);
      if (!isNaN(id) && relatedMoves[id]) {
        relatedMoves[id].moves = newValue;
        updates["system.relatedMoves"] = relatedMoves;
      }
    } else if (element.includes("additionalQuestion")) {
      const questions = foundry.utils.deepClone(this.system.additionalQuestion);
      const match = element.match(/\[(\d+)\]/);
      if (match) {
        const qIndex = parseInt(match[1]);
        if (questions[qIndex]) {
          questions[qIndex].question = newValue;
          updates["system.additionalQuestion"] = questions;
        }
      }
    } else if (element === "system.action.riseRollResults.useNumber") {
      updates[element] = Number(newValue);
    }

    if (Object.keys(updates).length > 0) {
      await this.update(updates);
    }
  }

  async removeRelatedMove(moveID) {
    const item = this;
    const relatedMoves = item.system.relatedMoves || [];
    const moveToRemove = relatedMoves[moveID];
    // Filter out the move with the given ID
    const updatedMoves = relatedMoves.filter(
      (m) => m.moves !== moveToRemove.moves,
    );

    await item.update({
      "system.relatedMoves": updatedMoves,
    });

    item.sheet.render(true);
  }
  async addRelatedMove() {
    const item = this;
    const relatedMoves = item.system.relatedMoves;
    const newMove = { moves: "" };
    await item.update({ "system.relatedMoves": [...relatedMoves, newMove] });
    item.sheet.render(true);
  }
  async addQuestion() {
    const item = this;
    const additionalQuestion = item.system.additionalQuestion;
    const newQuestion = { question: "" };
    await item.update({
      "system.additionalQuestion": [...additionalQuestion, newQuestion],
    });
    item.sheet.render(true);
  }
}
