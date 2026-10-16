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
    actions: {},
  };
  static PARTS = {
    main: {
      id: "main",
      template: "systems/SofH/templates/moves.hbs",
    },
  };
  async _prepareContext(partId, context) {
    context =await super._prepareContext(partId, context);
    async function enrich(html) {
      if (html) {
        if (html) {
          if (game.release.generation < 13) {
            return await TextEditor.enrichHTML(html, {
              secrets: context.owner,
              async: true,
            });
          } else {
            return await foundry.applications.ux.TextEditor.enrichHTML(html, {
              secrets: context.owner,
              async: true,
            });
          }
        } else {
          return html;
        }
      }
    }
     Object.assign(context, { system: { ...context.system, description: await enrich(context.model.system.description) } });
    Object.assign(context, { system: { ...context.system, triggers: await enrich(context.model.system.triggers) } });
    Object.assign(context, { system: { ...context.system, relatedmoves: await enrich(context.model.system.relatedmoves) } });
    const itemData = this.item.toObject(false);
    context.system = itemData.system;
    const { House } = CONFIG.SOFHCONFIG;
    Object.assign(context, { House });
    return context;
  }
}
