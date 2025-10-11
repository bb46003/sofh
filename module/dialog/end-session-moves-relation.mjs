import sofh_Utility from "../utility.mjs";
import { EndSessionLearnFromExperience } from "./end-session-move-exp.mjs";

export class EndSessionRelation extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    actions: {
      next: EndSessionRelation.#next,
    },
    position: {
      width: 700,
      height: "auto",
    },
    template: "systems/SofH/templates/dialogs/end-sesion-relation.hbs",
    window: { title: "sofh.dialog.makeOrBreakRelationship" },
  };

  async _renderHTML() {
    const actor = await game.actors.get(this.options.actorId);
    const system = actor.system;
    const html = await sofh_Utility.renderTemplate(this.options.template, {
      system: system,
    });
    return html;
  }

  async _replaceHTML(result, html) {
    html.innerHTML = result;
  }
  async _onRender() {
    const inputs = this.element.querySelectorAll(".change-relation");

    inputs.forEach((input) => {
      input.addEventListener("click", (ev) => {
        const el = ev.target;
        if (el.wasChecked) {
          el.checked = false;
          el.wasChecked = false;
        } else {
          inputs.forEach((i) => (i.wasChecked = false));
          el.wasChecked = true;
        }
      });
    });
  }
  static async #next() {
    const element = this.element;
    const actor = await game.actors.get(this.options.actorId);
    const inputs = element.querySelectorAll(".change-relation");
    const updateData = {};
    const changes = [];
    let brakethrough = false;
    let messageContent = "";
    inputs.forEach(async (input) => {
      const action = input.dataset.action;
      if (input.checked) {
        let newValue = 0;
        switch (action) {
          case "up":
            newValue = Number(input.dataset.relationvalue) + 1;
            if (newValue === 3) {
              newValue = -2;
              brakethrough = true;
            }
            break;
          case "down":
            newValue = Number(input.dataset.relationvalue) - 1;
            if (newValue === -3) {
              newValue = 2;
              brakethrough = true;
            }
        }
        updateData[input.dataset.relationid] = newValue;
        const relationName = input.closest("tr")?.querySelector("td")?.innerText ?? relationPath;
        const sign = action === "up" ? "+" : "-";
        changes.push(`${relationName}: ${input.dataset.relationvalue} → ${newValue} (${sign}1)`);

        if (Object.keys(updateData).length > 0) {
          messageContent = `
            <div class="relation-update">
              <strong>${actor.name}</strong> ${game.i18n.localize("sofh.dialog.updateRelation")} <br>
              <ul>
                ${changes.map((c) => `<li>${c}</li>`).join("")}
              </ul>
            </div>`;
          if (brakethrough) {
            messageContent += `
              <div class="relation-breakthrough">
                <p><em>${game.i18n.localize("sofh.dialog.breakthroughText")}</em></p>
                <button class="roll-breakthrough" data-action="${action}">
                  ${game.i18n.localize("sofh.dialog.rollBreakthrough")}
                </button>
              </div>`;
          }
        }
      }
    });
    if (messageContent !== "") {
      await actor.update(updateData);
      ChatMessage.create({
        user: game.user.id,
        speaker: game.user.name,
        content: messageContent,
      });
    }

    const data = { player: this.options.player, actorId: this.options.actorId };
    this.close();
    new EndSessionLearnFromExperience(data).render(true);
  }
}
