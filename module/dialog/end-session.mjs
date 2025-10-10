import sofh_Utility from "../utility.mjs";

export class EndSessionDialog extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    actions: {
      sendToPlayer: EndSessionDialog.#sendToPlayer,
      sendToALL: EndSessionDialog.#sendToALL,
    },
    position: {
      width: 640,
      height: "auto",
    },
    template: "systems/SofH/templates/dialogs/end-sesion-GM.hbs",
  };
  async _renderHTML() {
    const characters = await this._collectPlayerCharacterData();
    const html = await sofh_Utility.renderTemplate(this.options.template, {
      characters,
    });
    return html;
  }
  async _onRender() {
    const selects = this.element.querySelectorAll("select.assign-character");
    const sendAllBtn = this.element.querySelector(".send-btn-all");
    if (selects !== null) {
        this.updateSendAllButton(selects, sendAllBtn);
        selects.forEach((select) => {
        select.addEventListener("change", (ev) => {
          const target = ev.currentTarget;
          const entry = target.closest(".character-entry");
          const playerBtn = entry?.querySelector(".send-btn");
          if (playerBtn) playerBtn.disabled = target.value === "";
          this.updateSendAllButton(selects, sendAllBtn);
        });
      });
    }
  }

  async updateSendAllButton(selects, button) {
    const anyEmpty = Array.from(selects).some((s) => s.value === "");
    button.disabled = anyEmpty;
  }
  async _collectPlayerCharacterData() {

    const activePlayers = game.users.filter((u) => u.active && !u.isGM);
    const allActors = game.actors.contents;
    const playersData = activePlayers.map((u) => {
      const ownedActors = allActors.filter(
        (a) => a.type === "character" && a.testUserPermission(u, "OWNER"),
      );
      return {
        userId: u.id,
        playerName: u.name,
        actor: u.character?.type === "character" ? u.character : null,
        actorName: u.character?.type === "character" ? u.character.name : null,
        ownedActors: ownedActors.map((a) => ({
          id: a.id,
          name: a.name,
        })),
      };
    });

    return playersData;
  }

  async _replaceHTML(result, html) {
    html.innerHTML = result;
  }

  static #sendToPlayer(ev) {
    const entry = ev.target.closest(".character-entry");
    const span = entry.querySelector(".character-label");
    const select = entry.querySelector("select.assign-character");
    const playerId = span?.dataset.user || select?.dataset.user;
    const actorId = span?.dataset.actor || select?.value;
    game.system.socketHandler.emit({operation:"endOfSesionPlayer", player:playerId, actorId:actorId})
  }

  static #sendToALL(ev) {
    const target = ev.terget;
  }
}
