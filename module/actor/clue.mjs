import { moveRoll } from "../dialog/move-dialog.mjs";
import sofh_Utility from "../utility.mjs";

const { api, sheets } = foundry.applications;

export class SofhClue extends api.HandlebarsApplicationMixin(
  sheets.ActorSheetV2,
) {
  constructor(...args) {
    super(...args);
    this.y = 0;

    /** @type {CharacterActor} */
    this.actor;
  }
  static DEFAULT_OPTIONS = {
    id: "sofh-clue",

    position: { width: 800, height: 960, zIndex: 90 },
    actions: {
      addClue: SofhClue.#addClue,
      removeClue: SofhClue.#removeClue,
      rollForTheorize: SofhClue.#rollForTheorize,
      addSolution: SofhClue.#addSolution,
      removeSolution: SofhClue.#removeSolution,
      solutionRollForTheorize: SofhClue.#solutionRollForTheorize,
      removePartyMember: SofhClue.#removePartyMember,
      addPartyMember: SofhClue.#addPartyMember,
    },
    form: {
      submitOnChange: true,
    },
  };

  static PARTS = {
    main: {
      template: "systems/SofH/templates/clue.hbs",
    },
    solve_list: {
      id: "solve_list",
      template: "systems/SofH/templates/tab/mistery-solve-list.hbs",
    },
    clue_list: {
      id: "clue_list",
      template: "systems/SofH/templates/tab/clue-list.hbs",
    },
    party_list: {
      id: "party_list",
      template: "systems/SofH/templates/tab/party-list.hbs",
    },
  };
  static TABS = {
    primary: {
      tabs: [
        { id: "solve_list", group: "primary" },
        { id: "clue_list", group: "primary" },
        { id: "party_list", group: "primary" },
      ],
      initial: "solve_list",
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor;
    context.system = actor.system;
    context.actor = actor;
    context.isGM = game.user.isGM;
    return context;
  }

  _onDrop(event) {
    event.preventDefault();
    const data = event.dataTransfer;
    if (data) {
      const droppedItem = JSON.parse(data.getData("text/plain"));

      const droppedType = droppedItem.type;
      if (droppedType === "Actor") {
        const droppedActor = game.actors.get(droppedItem.uuid.split(".")[1]);
        if (droppedActor.type === "character") {
          let updateData = {};
          updateData[`system.actorID.${droppedActor._id}`] = {
            name: droppedActor.name,
            img: droppedActor.img,
          };
          this.actor.update(updateData);
          this.addOwnership(droppedActor._id);
        }
      }
    }
    event.currentTarget.classList.remove("drag-over");
  }
  static async #addClue(event) {
    event.preventDefault();

    const clues = this.actor.system.clue ?? {};

    const clueNumbers = Object.keys(clues).length;

    const updateData = {};

    updateData[`system.clue.${clueNumbers}.description`] = " ";

    const actorID = this.actor.system.actorID ?? [];

    const updatedActors = actorID.map((member) => ({
      ...member,
      [`have${clueNumbers}`]: false,
    }));

    updateData["system.actorID"] = updatedActors;

    await this.actor.update(updateData);
    this.actor.render(true);
  }
  static async #removeClue(ev) {
    const button = ev.target;
    const ID = Number(button.id);
    let clue = this.actor.system.clue;
    const newClue = { ...clue };
    delete newClue[ID];
    const actorsId = this.actor.system.actorID;
    if (actorsId && typeof actorsId === "object") {
      for (const actorId in actorsId) {
        if (actorsId[actorId].hasOwnProperty(`have${ID}`)) {
          delete actorsId[actorId][`have${ID}`]; // Remove the specific property
        }
      }
      await this.actor.update({
        "system.actorID": [{}],
        "system.clue": [{}],
      });
      await this.actor.update({
        "system.actorID": actorsId,
        "system.clue": newClue,
      });
    }
  }
  static async #removePartyMember(event) {
    event.preventDefault();
    const target = event.target.dataset.id;
    const actor = this.actor;
    await actor.system.removeMember(target);
    //await actor.update(updateData);
    await this.removeOwnership(target);

    await actor.render(true);
  }
  static async #addPartyMember(event) {
    const actors = game.actors.filter((actor) => actor.type === "character");

    const currentMember = this.actor.system.actorID ?? {};

    const filteredActors = actors.filter(
      (actor) => !Object.keys(currentMember).includes(actor.id),
    );

    const html = await sofh_Utility.renderTemplate(
      "systems/SofH/templates/dialogs/add-patry-member.hbs",
      { actors: filteredActors },
    );

    await foundry.applications.api.DialogV2.wait({
      window: {
        title: game.i18n.localize("sofh.ui.clue.add-party-member"),
        width: 200,
      },
      content: html,
      buttons: [
        {
          action: "add",
          label: game.i18n.localize("EFFECT.MODE_ADD"),
          callback: async (event, button, dialog) => {
            const element = dialog.element;

            await this.addMembets(element);
          },
        },
      ],
      default: "add",
    });
  }
  async addMembets(html) {
    const checkedInputs = html.querySelectorAll(
      ".party-memeber-add input[type='checkbox']:checked",
    );

    if (!checkedInputs.length) return;

    const partyMembers = [...(this.actor.system.actorID ?? [])];

    for (const input of checkedInputs) {
      const memberElement = input.closest(".party-memeber-add");
      const actorId = memberElement?.id;

      if (!actorId) continue;

      const actor = game.actors.get(actorId);

      if (!actor) continue;

      // Prevent duplicates
      if (partyMembers.some((member) => member.id === actorId)) {
        continue;
      }

      partyMembers.push({
        id: actor.id,
        name: actor.name,
        img: actor.img,
      });
    }

    await this.actor.update({
      "system.actorID": partyMembers,
    });

    this.render(true);
  }

  async addOwnership(characterID) {
    const users = Array.from(game.users.values());
    const filteredUsers = users.filter(
      (user) => user.role !== 4 && user?.character?.id === characterID,
    );
    const filteredUser = filteredUsers[0];
    if (filteredUser !== undefined) {
      const actor = this.actor;
      await actor.update({ [`ownership.${filteredUser._id}`]: 3 });
    }
  }
  async removeOwnership(characterID) {
    const users = Array.from(game.users.values());
    const filteredUsers = users.filter(
      (user) => user.role !== 4 && user?.character?.id === characterID,
    );
    const filteredUser = filteredUsers[0];
    if (filteredUser !== undefined) {
      const actor = this.actor;
      await actor.update({ [`ownership.${filteredUser._id}`]: 0 });
    }
  }

  static async #rollForTheorize(event) {
    event.preventDefault();
    const user = game.user._id;
    const actor = game.actors.get(event.target.offsetParent.id);
    const ownership = actor.ownership;
    const hasAccess = ownership[user] === 3;

    if (hasAccess) {
      const item = actor.items.filter((move) => move.id === event.target.id)[0];
      const dialogInstance = new moveRoll(actor, item, this.actor.id);
      dialogInstance.render({ force: true });
    } else {
      ui.notifications.warn(game.i18n.localize("sofh.you_are_not_owner"));
    }
    this.form.style.zIndex = 1;
  }
  static async #addSolution(event) {
    if (!game.user.isGM) return;

    const clue = this.actor;

    const solutions = [...(clue.system.solutions ?? [])];

    solutions.push({
      solution: "",
      question: "",
      complexity: 0,
      showToPlayer: false,
    });

    await clue.update({
      "system.solutions": solutions,
    });
  }

  static async #removeSolution(ev) {
    ev.preventDefault();
    if (game.user.isGM) {
      const target = ev.target.id;
      const actor = this.actor;
      let allSolution = actor.system.solutions;
      if (allSolution.hasOwnProperty(target)) {
        delete allSolution[target];
      }
      const updateData = allSolution;
      await actor.update({ "system.solutions": [{}] });

      await actor.update({ "system.solutions": updateData });

      await actor.render(true);
    }
  }

  static async #solutionRollForTheorize(ev) {
    ev.preventDefault();
    const user = game.user._id;
    const actor = game.user.character;
    const ownership = actor.ownership;
    const hasAccess = ownership[user] === 3;
    const solutionGroup = ev.target.closest(".solution-group");
    const complexityInput = solutionGroup.querySelector(".complexity");
    const complexity = complexityInput
      ? parseFloat(complexityInput.value)
      : undefined;
    const question = solutionGroup.querySelector(".solution-question").value;
    const solution = solutionGroup.querySelector(".solution").textContent;

    if (hasAccess) {
      const item = actor.items.filter((move) => move.id === ev.target.id)[0];
      const dialogInstance = new moveRoll(actor, item, this.actor.id);
      dialogInstance.rollForMove(
        actor,
        item,
        this.actor.id,
        complexity,
        question,
        solution,
      );
    } else {
      ui.notifications.warn(game.i18n.localize("sofh.you_are_not_owner"));
    }
  }

  _processFormData(event, form, formData) {
    const target = event?.target;
    const name = target?.name;

    const data = { object: {} };

    if (typeof name === "string") {
      if (name.includes("system.actorID")) {
        const match = name.split(".");
        const actorID = [...(this.actor.system.actorID || [])];

        const index = Number(match[2]); // important: array index
        const field = match[3];

        if (!actorID[index]) {
          actorID[index] = {};
        }

        // checkbox support
        const value =
          target.type === "checkbox" ? target.checked : target.value;

        actorID[index][field] = value;

        // optional cleanup (keep only valid members)
        const cleaned = actorID.filter(
          (m) => m && typeof m === "object" && m.id && m.name && m.img,
        );

        data.object["system.actorID"] = cleaned;
      }

      // 🔹 KEEP your existing strings logic
      if (name.includes("system.clue")) {
        const match = name.split(".");
        const clue = this.actor.system.clue || {};
        const index = match[2];
        const field = match[3];

        if (!clue[index]) {
          clue[index] = {};
        }

        clue[index][field] = target?.value;
        data.object["system.clue"] = clue;
      }
      if (name.includes("system.solutions")) {
        const match = name.split(".");
        const solutions = [...(this.actor.system.solutions || [])];

        const index = Number(match[2]);
        const field = match[3];

        if (!solutions[index]) {
          solutions[index] = {};
        }

        // checkbox support
        const value =
          target.type === "checkbox" ? target.checked : target.value;

        solutions[index][field] = value;

        data.object["system.solutions"] = solutions;
      }
      if (name.includes("name")) {
        data.object["name"] = target.value;
      }
    }

    // 🔹 Preserve scroll (your logic)
    const scrollEl = target.closest(".tab.active");
    if (scrollEl) {
      this._scrollTarget = scrollEl;
      this.y = scrollEl.scrollTop;
    }

    const process = super._processFormData(event, form, data);

    this.actor.sheet.render({ force: true });

    return process;
  }
}
