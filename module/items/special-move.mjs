const { api, sheets } = foundry.applications;

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
  async _prepareContext(partId, context) {
    const itemData = await this.getData(partId, context);
    return itemData;
  }

  async getData(partId, context) {
    const itemData = this.document.toObject(false);   
    //itemData.system.resultsChange["7to9"] = await enrich(itemData.system.resultsChange["7to9"]);
    // itemData.system.resultsChange.above10 =  await enrich(itemData.system.resultsChange.above10)
    //itemData.system.resultsChange.above12 =  await enrich(itemData.system.resultsChange.above12)
    context = {
      item: this.document,
      system: itemData.system,
      fields: this.document.system?.schema?.fields ?? {},
      isEditable: this.isEditable,
      source: this.document.toObject(),
      formInput: itemData.system?.resultsChange ?? {},
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
    const target = event.target;
    const id = target.dataset.id;
    this.item.addRelatedMove(id);
  }
  static async #removeRelatedMove(event, element) {
    this.item.removeRelatedMove();
  }
}
