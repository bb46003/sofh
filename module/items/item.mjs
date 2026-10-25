const { api, sheets } = foundry.applications;

export class sofhMovesSheet extends api.HandlebarsApplicationMixin(
  sheets.ItemSheetV2,
) {
  static DEFAULT_OPTIONS = {
    classes: ["sofh", "sheet", "item"],
    position: {
      width: 800,
      height: 800,
    },
    window: {
      resizable: true,
    },
    form: {
      submitOnChange: true,
    },
    actions: {
      addquestion: sofhMovesSheet.#addquestion,
      isrolled: sofhMovesSheet.#rollingguestions,
      removeQuestion: sofhMovesSheet.#removequestion
    },
  };
  static PARTS = {
    main: {
      id: "main",
      template: "systems/SofH/templates/moves.hbs",
    },
  };
  async _prepareContext(partId, context) {
    context = await super._prepareContext(partId, context);

    const itemData = this.item.toObject(false);
    context.system = itemData.system;
    const { House } = CONFIG.SOFHCONFIG;
    Object.assign(context, {
      House,
      systemFields: this.item.system.schema.fields,
    });
    context.triggers = {
      value: this.item.system.triggers,
      enriched: await this._enrich(this.item.system.triggers),
      field: this.item.system.schema.fields.triggers,
    };
    context.description = {
      value: this.item.system.description,
      enriched: await this._enrich(this.item.system.description),
      field: this.item.system.schema.fields.description,
    };
    context.relatedmoves = {
      value: this.item.system.relatedmoves,
      enriched: await this._enrich(this.item.system.relatedmoves),
      field: this.item.system.schema.fields.relatedmoves,
    };
    Object.assign(context, {
      ["designer-comment"]: {
        value: this.item.system["designer-comment"],
        enriched: await this._enrich(this.item.system["designer-comment"]),
        field: this.item.system.schema.fields["designer-comment"],
      },
    });
    Object.assign(context, {
      ["7to9"]: {
        value: this.item.system["7to9"],
        enriched: await this._enrich(this.item.system["7to9"]),
        field: this.item.system.schema.fields["7to9"],
      },
    });
    context.below7 = {
      value: this.item.system.below7,
      enriched: await this._enrich(this.item.system.below7),
      field: this.item.system.schema.fields.below7,
    };
    context.above10 = {
      value: this.item.system.above10,
      enriched: await this._enrich(this.item.system.above10),
      field: this.item.system.schema.fields.above10,
    };
    context.above12 = {
      value: this.item.system.above12,
      enriched: await this._enrich(this.item.system.above12),
      field: this.item.system.schema.fields.above12,
    };
    context.item = this.item;
    return context;
  }
  async _enrich(html) {
    if (!html) return html;
    return await foundry.applications.ux.TextEditor.enrichHTML(html, {
      secrets: this.item.isOwner,
      async: true,
    });
  }
  static async #addquestion() {
    const item = this.item;
    let question = item.system.question || [];
    let i = Object.keys(question).length;
    const questionElement = {
      impact: "false",
      description: "",
    };
    question[i] = questionElement;
    await item.update({ "system.question": question });
    Hooks.once("renderItemSheet", (sheet, html) => {
      if (sheet.item.id !== item.id) return;
      const target = html[0].querySelector("#add-question-btn");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }
  static async #removequestion(ev) {
    const button = ev.target;
    const ID = button.id;
    let question = this.item.system.question;
    let newQuestion;
    newQuestion = { ...question };
    delete newQuestion[ID];

    const numberOfQuestion = Object.values(newQuestion).length;
    if (numberOfQuestion === 0) {
      await this.item.update({ "system.question": [] });
    } else {
      await this.item.update({ "system.question": [] });
      await this.item.update({ "system.question": newQuestion });
    }
    Hooks.once("renderItemSheet", (sheet, html) => {
      if (sheet.item.id !== item.id) return;
      const target = html[0].querySelector("#add-question-btn");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }
  static async #relatedmoves(ev) {
    const updateData = { [ev.target.name]: ev.target.value };
    await this.item.update(updateData);
  }

  static async #rollingguestions(ev) {
    await this.changeRollingoption(ev.target.checked)
  }
  async changeRollingoption(isRolled) {
    if (!isRolled) {
      const updateData = {
        ["system.housequestion"]: false,
        ["system.relationrelated"]: false,
        ["system.stringsrelated"]: false,
        ["system.havequestion"]: false,
        ["system.realtedtoothermoves"]: false,
        ["system.result12"]: false,
        ["system.cluerelated"]: false
      };
      await this.item.update(updateData);
    }
  }
_processFormData(event, form, formData) {
      const data = { object: {...formData.object} };

  const klucze = [
    "7to9",
    "above10",
    "above12",
    "below7",
    "description",
    "designer-comment",
    "relatedmoves",
    "triggers"
  ];

  for (const key of klucze) {
    if (key in formData.object) {
      data.object[`system.${key}`] = formData.object[key];
      delete data[key];
    }
  }

  return super._processFormData(event, form, data);
}
}
