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
    window: {
      resizable: true,
    },
    form: {
      handler: sofhSpecialMovesSheet.myFormHandler,
      submitOnChange: true,
    },
    actions: {
      addRelatedMove: sofhSpecialMovesSheet.#addRelatedMove,
      removeRelatedMove: sofhSpecialMovesSheet.#removeRelatedMove,
      addQuestion: sofhSpecialMovesSheet.#addQuestion,
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
    const itemData = await this.getData();
    return itemData;
  }

  async getData() {
    const context = {};
    const itemData = this.document.toObject(false);
    context.system = itemData.system;
    context.fields = this.document.system?.schema?.fields ?? {};
    async function enrich(html) {
      if (html) {
        return await TextEditor.enrichHTML(html, {
          secrets: game.user.isOwner,
          async: true,
        });
      } else {
        return html;
      }
    }
    const enrichHTML =
      foundry.applications?.ux?.TextEditor?.enrichHTML || enrich;
    context["7to9"] = {
      value: itemData.system.resultsChange["7to9"],
      enriched: await enrichHTML(itemData.system.resultsChange["7to9"]),
      field: context.fields.resultsChange.fields["7to9"],
    };
    context.above12 = {
      value: itemData.system.resultsChange.above12,
      enriched: await enrichHTML(itemData.system.resultsChange.above12),
      field: context.fields.resultsChange.fields.above12,
    };
    context.above10 = {
      value: itemData.system.resultsChange.above10,
      enriched: await enrichHTML(itemData.system.resultsChange.above10),
      field: context.fields.resultsChange.fields.above10,
    };
    context.below7 = {
      value: itemData.system.resultsChange.below7,
      enriched: await enrichHTML(itemData.system.resultsChange.below7),
      field: context.fields.resultsChange.fields.below7,
    };
    context.description = {
      value: itemData.system.description,
      enriched: await enrichHTML(itemData.system.description),
      field: context.fields.description,
    };
    context.triggers = {
      value: itemData.system.triggers,
      enriched: await enrichHTML(itemData.system.triggers),
      field: context.fields.triggers,
    };
    context.additionalQuestions = await Promise.all(
      itemData.system.additionalQuestion.map(async (q, i) => ({
        value: q.question,
        enriched: await enrichHTML(q.question),
        field: context.fields.additionalQuestion.element.fields.question,
      })),
    );

    context.addQuestion = context.item = this.document;
    context.system = itemData.system;
    context.isEditable = this.isEditable;
    context.source = this.document.toObject();

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
  static #addRelatedMove() {
    this.item.addRelatedMove();
  }
  static async #removeRelatedMove(event) {
    const target = event.target;
    const id = target.dataset.id;
    this.item.removeRelatedMove(id);
  }
  static async #addQuestion() {
    this.item.addQuestion();
  }
}
