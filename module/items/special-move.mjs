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
      handler: sofhSpecialMovesSheet.myFormHandler,
      submitOnChange: true,
    },
    actions: {},
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
}
