import sofh_Utility from "../utility.mjs";

export class EndSessionRelation extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    actions: {
      next: EndSessionRelation.#next
    },
    position: {
      width: 700,
      height: "auto",
    },
    template: "systems/SofH/templates/dialogs/end-sesion-relation.hbs", 
    window:{title: "sofh.dialog.makeOrBreakRelationship" }
  };

  async _renderHTML() {
    const actor = await game.actors.get(this.options.actorId);
    const system = actor.system;
    const html = await sofh_Utility.renderTemplate(this.options.template, {system: system});
    return html;
  }

  async _replaceHTML(result, html) {
    html.innerHTML = result;
  }
  static #next(){

  }
}

