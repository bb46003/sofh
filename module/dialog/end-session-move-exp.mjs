import sofh_Utility from "../utility.mjs";
import { EndSessionYourReputation } from "./end-session-move-reputation.mjs";

export class EndSessionLearnFromExperience extends foundry.applications.api
  .ApplicationV2 {
  static DEFAULT_OPTIONS = {
    actions: {
      next: EndSessionLearnFromExperience.#next,
    },
    position: {
      width: 550,
      height: "auto",
    },
    template: "systems/SofH/templates/dialogs/end-sesion-xp.hbs",
    window: { title: "sofh.dialog.learnFromExperience" },
  };

  async _renderHTML() {
    const html = await sofh_Utility.renderTemplate(this.options.template);
    return html;
  }

  async _replaceHTML(result, html) {
    html.innerHTML = result;
  }

  static async #next() {
    const element = this.element;
    const actor = await game.actors.get(this.options.actorId);
    const inputs = element.querySelectorAll(`input[type="checkbox"]`);
    let gainXP = 0;
    inputs.forEach((input) => {
      if (input.checked) gainXP += 1;
    });
    const xpValues = actor.system.xp.value;
    const keys = Object.keys(xpValues).map(Number);
    let trueXP = keys.reverse().find((key) => xpValues[key] === true);
    if (trueXP === undefined) trueXP = 0;
    const updateData = {};
    let newXp = trueXP + gainXP;
    if (newXp > 7) {
      newXp = newXp - 7;
      updateData["system.advancement"] = true;
    }

    for (let i = 1; i <= 7; i++) {
      const key = `system.xp.value.${i}`;
      updateData[key] = i <= newXp;
    }
    if (Object.keys(updateData).length > 0) {
      await actor.update(updateData);
      ChatMessage.create({
        user: game.user.id,
        speaker: game.user.name,
        content: game.i18n.format("sofh.ui.chat.gainxp", {
          actor: actor.name,
          gainXP: gainXP,
        }),
      });
    }
    const data = { player: this.options.player, actorId: this.options.actorId };
    this.close();
    new EndSessionYourReputation(data).render(true);
  }
}
