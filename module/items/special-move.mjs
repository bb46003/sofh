const { api, sheets } = foundry.applications;
import sofh_Utility from "../utility.mjs";

export class sofhSpecialMovesSheet extends api.HandlebarsApplicationMixin(
  sheets.ItemSheetV2,
) {
  static DEFAULT_OPTIONS = {
    classes: ["specialMoves"],
    tag: "form",
    position: {
      width: 560,
      height: 695,
    },
    form: {
      submitOnChange: true,
    },
    actions: {
      addRelatedMove: sofhSpecialMovesSheet.#addRelatedMove,
      removeRelatedMove: sofhSpecialMovesSheet.#removeRelatedMove,
    },
    item: {
      type: "specialPlaybookMoves",
    },
  };
  static PARTS = {
    main: {
      id: "main",
      template: "systems/SofH/templates/special-moves.hbs",
    },
  };
  async _prepareContext(options) {
    const itemData = await this.getData();
    return itemData;
  }

  async getData() {
    const itemData = this.document.toObject(false);
    const baseActions = CONFIG.SOFHCONFIG.typeOfSpecialMoves;
    const storedActions = itemData.system.action || {};
    const convertedActions = Object.entries(baseActions).reduce((acc, [key, label]) => {
      acc[key] = {
      label,
      isUse: storedActions[key]?.isUse ?? false
      };
      return acc;
    }, {});

  itemData.system.action = convertedActions;
    const context = {
      item: this.document,
      system: itemData.system,
      fields: this.document.system?.schema?.fields ?? {},
      isEditable: this.isEditable,
      source: this.document.toObject(),
    };

    return context;
  }
  static async myFormHandler(event, form, formData) {
    if (event.type !== "submit") {
      let name = event.target.dataset.name;
      let element = event.target.dataset.element;
      if (element === undefined) {
        element = event.target.name;
      }
      let name2 = "";
      if (name === "koszt") {
        name2 = event.target.dataset.type;
      }
      const index = Number(event.target.dataset.index);
      await this.item.zmianaDanych(event, name, index, name2, element);
    }
    if (event.type === "submit") {
      await this.item.update({ ["img"]: formData.object.img });
    }
  }
static #addRelatedMove(event, element) {
  const div = event.target.closest("div");
  const id = div.querySelectorAll("#related-move").length;
  const newRelatedMove = `<input type="text" id="related-move" name="system.relatedMoves.${id}"><i class="fa fa-trash" data-action="removeRelatedMove"></i></input>`;
  div.insertAdjacentHTML("beforeend", newRelatedMove);
}
static async #removeRelatedMove(event, element) {
  const input = event.target.previousElementSibling;
  const moveID = input.name.split(".")[2];
  this.item.removeRelatedMove(moveID)
}
}
