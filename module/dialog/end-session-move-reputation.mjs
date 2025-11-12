import sofh_Utility from "../utility.mjs";

export class EndSessionYourReputation extends foundry.applications.api
  .ApplicationV2 {
  static DEFAULT_OPTIONS = {
    actions: {
      next: EndSessionYourReputation.#next,
    },
    position: {
      width: 550,
      height: "auto",
    },
    template: "systems/SofH/templates/dialogs/end-sesion-reputation.hbs",
    window: { title: "sofh.dialog.gainReputaton" },
  };

  async _renderHTML() {
    const actor = await game.actors.get(this.options.actorId);
    let question1 = actor.system.reputationQuestion1;
    let question2 = actor.system.reputationQuestion2;
    const repTable = {
      gryffindor: [
        "sofh.dialog.reputation.gryffindor1",
        "sofh.dialog.reputation.gryffindor2",
        "sofh.dialog.reputation.gryffindor3",
        "sofh.dialog.reputation.gryffindor4",
      ],
      hufflepuff: [
        "sofh.dialog.reputation.hufflepuff1",
        "sofh.dialog.reputation.hufflepuff2",
        "sofh.dialog.reputation.hufflepuff3",
        "sofh.dialog.reputation.hufflepuff4",
      ],
      ravenclaw: [
        "sofh.dialog.reputation.ravenclaw1",
        "sofh.dialog.reputation.ravenclaw2",
        "sofh.dialog.reputation.ravenclaw3",
      ],
      slytherin: [
        "sofh.dialog.reputation.slytherin1",
        "sofh.dialog.reputation.slytherin2",
        "sofh.dialog.reputation.slytherin3",
      ],
    };
    const house = actor.system.house;
    if (!isNaN(Number(question1))) {
      question1 = game.i18n.localize(repTable[house][Number(question1)]);
    }
    if (!isNaN(Number(question2))) {
      question2 = game.i18n.localize(repTable[house][Number(question2)]);
    }
    const html = await sofh_Utility.renderTemplate(this.options.template, {
      q1: question1,
      q2: question2,
    });
    return html;
  }

  async _replaceHTML(result, html) {
    html.innerHTML = result;
  }
  static async #next() {
    const element = this.element;
    const actor = await game.actors.get(this.options.actorId);
    const inputs = element.querySelectorAll(`input[type="checkbox"]`);
    let gainRep = 0;
    inputs.forEach((input) => {
      if (input.checked) gainRep += 1;
    });
    const reputationValue = actor.system.reputation.value;
    const keys = Object.keys(reputationValue).map(Number);
    let trueReputation = keys
      .reverse()
      .find((key) => reputationValue[key] === true);
    if (trueReputation === undefined) trueReputation = 0;
    const updateData = {};
    let newRep = trueReputation + gainRep;
    let riseRank = false;
    if (newRep >= 7) {
      newRep = newRep - 7;
      riseRank = true;
      const currentRank = actor.system.reputation.rank;
      const currentTS = actor.system.reputation.timeToShine;
      updateData["system.reputation.rank"] = currentRank + 1;
      updateData["system.reputation.timeToShine"] = currentTS + 1;
    }
    for (let i = 1; i <= 7; i++) {
      const key = `system.reputation.value.${i}`;
      updateData[key] = i <= newRep;
    }
    if (Object.keys(updateData).length > 0) {
      await actor.update(updateData);
      ChatMessage.create({
        user: game.user.id,
        speaker: game.user.name,
        content: game.i18n.format("sofh.ui.chat.gainRep", {
          actor: actor.name,
          gainRep: gainRep,
        }),
      });
    }
    this.close();
  }
}
