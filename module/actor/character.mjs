import { moveRoll } from "../dialog/move-dialog.mjs";
import sofh_Utility from "../utility.mjs";
import { ReputationQuestion } from "../dialog/reputation-question.mjs";

const BaseActorSheet =
  typeof foundry?.appv1?.sheets?.ActorSheet !== "undefined"
    ? foundry.appv1.sheets.ActorSheet
    : ActorSheet;
export class sofhCharacterSheet extends BaseActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sofh", "sheet", "actor", "character", "dialog-button"],
      template: "systems/SofH/templates/character-sheet.hbs",
      width: 800,
      height: 960,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "characteristic",
        },
      ],
    });
  }

  async getData() {
    const context = super.getData();
    const actorData = this.actor.toObject(false);
    context.system = actorData.system;
    const {
      bloodType,
      favoriteTopic,
      favoriteTopic2,
      House,
      conditionstype,
      equipment,
      houseeq,
      characterRelation,
      goal,
      timeToShine,
    } = CONFIG.SOFHCONFIG;

    Object.assign(context, {
      bloodType,
      favoriteTopic,
      favoriteTopic2,
      House,
      conditionstype,
      equipment,
      houseeq,
      characterRelation,
      goal,
      timeToShine,
    });

    async function enrich(html) {
      if (html) {
        if (game.release.generation < 13) {
          return await TextEditor.enrichHTML(html, {
            secrets: context.actor.isOwner,
            async: true,
          });
        } else {
          return await foundry.applications.ux.TextEditor.enrichHTML(html, {
            secrets: context.actor.isOwner,
            async: true,
          });
        }
      } else {
        return html;
      }
    }

    context.system.equipment = await enrich(context.system.equipment);
    this._prepareMoves(context);

    return context;
  }

  _prepareMoves(context) {
    const basicMoves = [];
    const houseMoves = [];
    const peripheralMoves = [];
    const endOfSessionMoves = [];
    const specialPlaybookMoves = [];

    for (let item of context.actor.items) {
      switch (item.type) {
        case "basicMoves":
          basicMoves.push(item);
          break;
        case "houseMoves":
          houseMoves.push(item);
          break;
        case "peripheralMoves":
          peripheralMoves.push(item);
          break;
        case "endOfSessionMoves":
          endOfSessionMoves.push(item);
          break;
        case "specialPlaybookMoves":
          specialPlaybookMoves.push(item);
          break;
        default:
          console.warn(`Unknown item type: ${item.type}`);
          break;
      }
    }
    basicMoves.sort((a, b) => a.name.localeCompare(b.name));
    houseMoves.sort((a, b) => a.name.localeCompare(b.name));
    peripheralMoves.sort((a, b) => a.name.localeCompare(b.name));
    endOfSessionMoves.sort((a, b) => a.name.localeCompare(b.name));
    specialPlaybookMoves.sort((a, b) => a.name.localeCompare(b.name));

    // After assigning the items to each array, assign these arrays to the context object
    context.basicMoves = basicMoves;
    context.houseMoves = houseMoves;
    context.peripheralMoves = peripheralMoves;
    context.endOfSessionMoves = endOfSessionMoves;
    context.specialPlaybookMoves = specialPlaybookMoves;
  }

  async activateListeners(html) {
    super.activateListeners(html);

    html.on("change", ".circle-checkbox-reputation", (ev) =>
      this.handleReputationChange(ev),
    );
    html.on("change", ".circle-checkbox-xp", (ev) => this.handleXpChange(ev));
    html.on("click", ".decrease-btn", () => this.lowerReputationRank());
    html.on("change", ".house", (ev) => this.handleHouseChange(ev));
    html.on("change", ".condition-text, .condition-type", (ev) =>
      this.updateActorCondition(ev),
    );
    html.on("click", ".hover-label-question", () =>
      this.assignHouseQuestions(this.actor.system.home, false),
    );
    html.on("click", (ev) => this.handleDiamondClick(ev));
    html.on("click", "#add-string-btn", (ev) => this.addStringItem(ev));
    html.on("click", ".remove-string-btn", (ev) => this.removeStringItem(ev));
    html.on("click", "#add-advantage-btn", (ev) => this.addAdvantagItem(ev));
    html.on("click", ".remove-advanatage-btn", (ev) =>
      this.removeAdvantageItem(ev),
    );
    html.on("click", ".move_type", (ev) => this.showMoves(ev));
    html.on("click", ".moves", (ev) => this.collapsAllMoves(ev));
    html.on("click", ".remove-moves-btn", (ev) => this.removeMoves(ev));
    html.on("click contextmenu", ".moves-edit", (ev) => this.openMoves(ev));
    html.on("click", ".roll-moves-btn", (ev) => this.rollForMove(ev));
    html.on("click", ".moves-description-open", (ev) =>
      this.openMovesFromTriggers(ev),
    );
    html.on("click", ".send-to-chat-moves-btn", (ev) =>
      this.openMovesFromTriggers(ev),
    );
    html.on("click", ".time_to_shine", (ev) => this.showTimeToShine(ev));
    html.on("change", "#schoolyear", (ev) => this.changeYear(ev));
    html.on("click", "#reputationQuestions", (ev) =>
      this.changeReputationQuestions(ev),
    );
    html.on("click", "#advamcmentDialog", (ev) => this.advamcmentDialog(ev));
    html.on("click", "i.fa.fa-trash", (ev) => this.removeAdditionalTopic(ev));
    html.on("change", ".additional-subject", (ev) =>
      this.changeAditionalSubjectFromMove(ev),
    );
  }

  async handleReputationChange(ev) {
    const isChecked = $(ev.target).prop("checked");
    const ID = ev.target.id[0];
    await this.updateReputation(ID, isChecked);
  }

  async handleXpChange(ev) {
    const isChecked = $(ev.target).prop("checked");
    const ID = ev.target.id[0];
    await this.updateXp(ID, isChecked);
    if (Number(ID) === 7 && isChecked) {
      await this.actor.update({ ["system.advancement"]: true });
    }
  }
  async advamcmentDialog(ev) {
    const content = await sofh_Utility.renderTemplate(
      "systems/SofH/templates/dialogs/xp.hbs",
    );
    const pickAdvancement = new foundry.applications.api.DialogV2({
      widnow: { title: game.i18n.localize("sofh.ui.gainxp") },
      content,
      buttons: [
        {
          label: game.i18n.localize("sofh.UI.OK"),
          icon: "fa-solid fa-check",
          action: "ok",
          callback: async (event, html) => {
            const selected = html.offsetParent.querySelector(
              'input[name="advancement"]:checked',
            );
            if (!selected) {
              ui.notifications.warn(game.i18n.localize("sofh.ui.selectOption"));
              return false;
            }
            const choice = selected.value;
            ChatMessage.create({
              user: game.user.id,
              speaker: game.user.name,
              content: `${game.i18n.localize("sofh.ui.gainxp")}: <b>${choice}</b>`,
            });
            await this.actor.update({ ["system.advancement"]: false });
          },
        },
      ],
      defaultButton: "ok",
    });
    pickAdvancement.render(true, { width: 600 });
  }

  async removeMoves(ev) {
    const button = ev.target.closest(".remove-moves-btn");
    const ID = button.id;
    const item = this.actor.items.get(ID);
    const innerText = game.i18n.format("sofh.ui.dialog.deleteMove", {
      name: item.name,
    });
    const d = new Dialog({
      title: game.i18n.format("sofh.ui.dialog.deleteMoveTitle", {
        name: item.name,
      }),
      content: `
        <p>${innerText}</p>
      `,
      buttons: {
        delete: {
          label: game.i18n.localize("Delete"),
          callback: async () => {
            await this.actor.deleteEmbeddedDocuments("Item", [ID]);
            const movesElement = $(".all-moves." + item.type);
            await movesElement.css("display", "");
            if (item.system?.action.addFavoriteTopic.isUse) {
              const additionalTopic = foundry.utils.deepClone(
                this.actor.system.additionalTopic,
              );
              const cleanedTopics = Object.values(additionalTopic).filter(
                (topic) => topic?.id && topic?.name && topic.id !== ID,
              );
              await this.actor.update({
                "system.additionalTopic": cleanedTopics,
              });
              this.actor.sheet.render(true);
            }
          },
        },
        cancel: {
          label: game.i18n.localize("Cancel"),
          callback: () => {
            ui.notifications.info("Deletion canceled.");
          },
        },
      },
      default: "cancel",
      close: () => {},
    });
    d.render(true);
  }

  async handleHouseChange(ev) {
    const house = ev.target.value;
    await this.actor.update({ [`system.home`]: house.toLowerCase() });
    await this.actor.update({ [`system.house`]: house.toLowerCase() });
    if (house !== "") {
      this.actor.sheet.render();
      await this.assignGoal(house);
      const changeHouse = true;
      await this.assignHouseQuestions(house, changeHouse);
      await this.addEq(house);
    }
  }

  async handleDiamondClick(ev) {
    const element = ev.target.closest("div");
    if (element && this.isDiamondElement(element)) {
      await this.processDiamondClick(element);
    }
  }

  async isDiamondElement(element) {
    return [
      "minustwo",
      "two",
      "one",
      "zero",
      "right-bottom",
      "right-top",
      "left-top",
      "center",
      "left-bottom",
    ].some((className) => element.classList.contains(className));
  }

  async updateReputation(index, value) {
    const actor = this.actor;
    const updateData = {};
    const index2 = Number(index);
    const currentRank = actor.system.reputation.rank;
    const currentTS = actor.system.reputation.timeToShine;

    if (currentRank !== 5) {
      if (index2 === 7 && value) {
        updateData[`system.reputation.value.${7}`] = true;
        await actor.update(updateData);
        for (let i = 1; i <= 7; i++) {
          updateData[`system.reputation.value.${i}`] = false;
        }
        updateData["system.reputation.rank"] = currentRank + 1;
        updateData["system.reputation.timeToShine"] = currentTS + 1;
      } else {
        this.updateReputationValues(updateData, index2, value);
      }

      await actor.update(updateData);
    }
  }

  async updateReputationValues(updateData, index2, value) {
    for (let i = 1; i <= 7; i++) {
      updateData[`system.reputation.value.${i}`] = value
        ? i <= index2
        : i < index2;
    }
  }

  async updateXp(index, value) {
    const actor = this.actor;
    const updateData = {};
    const index2 = Number(index);

    if (index2 === 7 && value) {
      updateData[`system.xp.value.${7}`] = true;
      await actor.update(updateData);
      for (let i = 1; i <= 7; i++) {
        updateData[`system.xp.value.${i}`] = false;
      }
    } else {
      this.updateXpValues(updateData, index2, value);
    }
    await actor.update(updateData);
  }

  async updateXpValues(updateData, index2, value) {
    for (let i = 1; i <= 7; i++) {
      updateData[`system.xp.value.${i}`] = value ? i <= index2 : i < index2;
    }
  }

  async lowerReputationRank() {
    const actor = this.actor;
    const rank = Math.max(actor.system.reputation.rank - 1, 0);
    await actor.update({ "system.reputation.rank": rank });
  }

  async assignGoal(house) {
    const actor = this.actor;
    const goal = game.i18n.localize(CONFIG.SOFHCONFIG.goal["goal" + house]);
    await actor.update({
      "system.goal": goal,
      "system.home": game.i18n.localize(
        CONFIG.SOFHCONFIG.House[house].toLowerCase(),
      ),
    });
  }

  async assignHouseQuestions(house, changeHouse) {
    let question = await this.getHouseQuestions(house);
    const content = await sofh_Utility.renderTemplate(
      "systems/SofH/templates/dialogs/house-question.hbs",
      { question: question },
    );
    new Dialog({
      title: game.i18n.localize("sofh.ui.house-question"),
      content,
      buttons: {
        OK: {
          icon: '<i class="fa fa-check"></i>',
          label: `<div class="sofh-button">${game.i18n.localize("sofh.UI.OK")}</div>`,
          callback: (html) => {
            const selectedQuestion = html.find(
              'input[name="housequestion"]:checked',
            );

            // Check if an option is selected
            if (selectedQuestion.length === 0) {
              ui.notifications.warn(
                game.i18n.localize("sofh.ui.notSelectedHouseQuestion"),
              );
              this.assignHouseQuestions(house, changeHouse);
            } else {
              this.handleHouseQuestionSelection(html);
              if (changeHouse) {
                this.spefificHousEq(house);
              }
            }
          },
        },
      },
      default: "OK",
    }).render(true);
  }
  async getHouseQuestions(houseKey) {
    // Default: try translations
    let q1 = game.i18n.localize(`sofh.ui.actor.${houseKey}question1`);
    let q2 = game.i18n.localize(`sofh.ui.actor.${houseKey}question2`);

    // Check if translations are missing
    const missingQ1 = q1 === `sofh.ui.actor.${houseKey}question1`;
    const missingQ2 = q2 === `sofh.ui.actor.${houseKey}question2`;

    if (missingQ1 || missingQ2) {
      // Load saved customConfig
      const data = game.settings.get("SofH", "customConfig");

      if (data?.houses?.length) {
        const houseData = data.houses.find(
          (h) => h.name?.toLowerCase().replace(/\s+/g, "_") === houseKey,
        );

        if (houseData) {
          if (missingQ1 && houseData.question1) q1 = houseData.question1;
          if (missingQ2 && houseData.question2) q2 = houseData.question2;
        }
      }
    }

    return { q1, q2 };
  }
  async handleHouseQuestionSelection(html) {
    const selectedOption = html.find('input[name="housequestion"]:checked');
    if (selectedOption.length > 0) {
      const selectedLabel = selectedOption.next("label").text().trim();
      await this.actor.update({ ["system.housequestion"]: selectedLabel });
    } else {
      ui.notifications.warn(game.i18n.localize("sofh.ui.warning.noSelection"));
    }
  }

  async spefificHousEq(house) {
    const houseEq = CONFIG.SOFHCONFIG.houseeq[house];
    const actor = this.actor;
    const header = game.i18n.localize("sofh.ui.eqquestion");
    let content = `<h2 style="font-family: 'IM Fell English SC', serif;">${header}</h2><form id="equipmentForm">`;
    let i = 0;
    Object.keys(houseEq).forEach((key) => {
      const value = houseEq[key];
      const eq = game.i18n.localize(value);

      content += `
                <div class="sofh">
                    <label class="select-eq">
                        <input type="checkbox" name="equipment${i}" value="${eq}" class="equipment-option">
                        ${eq}
                    </label>
                </div>`;
      i++;
    });

    content += "</form>";
    const title = game.i18n.localize("sofh.ui.dialog.houseeq");

    const d = new Dialog({
      title: title,
      content: content,
      buttons: {
        submit: {
          label: `<div class ="sofh-button">${game.i18n.localize("sofh.ui.submit")}</div>`,
          callback: async (html) => {
            const selectedOptions = html.find('input[type="checkbox"]:checked');
            const selectedValues = [];
            selectedOptions.each(function () {
              selectedValues.push($(this).val());
            });

            if (selectedValues.length > 3) {
              ui.notifications.error(
                game.i18n.localize("sofh.ui.dialog.eqwarrning"),
              );
              return;
            }
            let currentEquipment = actor.system.equipment || "";
            selectedValues.forEach((value) => {
              currentEquipment += `<br>${value}`;
            });
            await actor.update({
              "system.equipment": currentEquipment,
            });
            ui.notifications.info(
              game.i18n.localize("sofh.ui.dialog.addeqconfirmation"),
            );
          },
          class: "my-button",
        },
        cancel: {
          label: `<div class ="sofh-button">${game.i18n.localize("sofh.ui.cancel")}</div>`,
          class: "my-button",
        },
      },
      default: "submit",
      close: () => {},
      render: (html) => {
        const radioButtons = html.find(".equipment-option");
        let selectedOptions = [];
        radioButtons.each(function () {
          $(this).on("change", function (event) {
            if (event.target.checked) {
              if (selectedOptions.length >= 3) {
                event.target.checked = false;
                ui.notifications.warn("You can only select up to 3 options!");
              } else {
                selectedOptions.push(event.target);
              }
            } else {
              selectedOptions = selectedOptions.filter(
                (item) => item !== event.target,
              );
            }
          });
        });
      },
    }).render(true);
  }

  async processDiamondClick(element) {
    if (element.parentNode.className === "diamond") {
      if (element.dataset.clicked) return;
      element.dataset.clicked = true;

      this.resetDiamondClickState(element);
      element.classList.toggle("clicked");

      const value = Number(element.querySelector("p")?.textContent || "");
      const elementId = Number(element.id);
      const updateData = { [`system.relation.value${elementId}`]: value };

      await this.actor.update(updateData);

      setTimeout(() => {
        delete element.dataset.clicked;
      }, 100);
    }
  }

  async resetDiamondClickState(element) {
    const positionClasses = [
      "left-bottom ",
      "center ",
      "right-bottom ",
      "left-top ",
      "right-top ",
    ];
    if (positionClasses.includes(element.className)) {
      Array.from(element.offsetParent.children).forEach((child) => {
        if (child.classList.contains("clicked")) {
          child.classList.remove("clicked");
        }
      });
    }
  }

  async addEq(house) {
    const baseEq = game.i18n.localize(CONFIG.SOFHCONFIG.equipment[house]);
    let formattedStr = baseEq.replace(/, /g, ",<br>");
    const actor = this.actor;
    let updateData = {};
    updateData["system.equipment"] = formattedStr;
    actor.update(updateData);
  }

  async addStringItem(ev) {
    const actor = this.actor;
    let strings = actor.system.strings || [];
    let i = Object.keys(strings).length + 1;
    const stringElement = {
      name: "",
      description: "",
    };
    strings[i] = stringElement;
    await actor.update({ "system.strings": strings });
  }

  async addAdvantagItem() {
    const actor = this.actor;
    let advanatage = actor.system.advanatage || [];
    let i = Object.keys(advanatage).length + 1;
    const advanatageElement = {
      description: "",
    };
    advanatage[i] = advanatageElement;
    await actor.update({ "system.advanatage": advanatage });
  }

  async removeStringItem(ev) {
    const button = ev.target.closest(".remove-string-btn");
    const ID = button.id;
    let strings = this.actor.system.strings;
    const newStrings = { ...strings };
    delete newStrings[ID];
    await this.actor.update({ "system.strings": [{}] });
    await this.actor.update({ "system.strings": newStrings });
  }

  async removeAdvantageItem(ev) {
    const button = ev.target.closest(".remove-advanatage-btn");
    const ID = button.id;
    let advanatage = this.actor.system.advanatage;
    const newAdvanatage = { ...advanatage };
    delete newAdvanatage[ID];
    await this.actor.update({ "system.advanatage": [{}] });
    await this.actor.update({ "system.advanatage": newAdvanatage });
  }

  async updateActorCondition(ev) {
    const actor = this.actor;
    const updateData = { [ev.target.name]: ev.target.value };
    await actor.update(updateData);
    const allConditionsMet = Object.values(actor.system.condition).every(
      (condition) => condition.type && condition.text,
    );
    await actor.update({ "system.is7conditions": allConditionsMet });
  }

  async openMoves(event) {
    const itemRow = event.target.closest(".sheet-table-data");
    const itemId = itemRow.getAttribute("data-item-id");
    const move = this.actor.items.get(itemId);
    if (event.type === "contextmenu") {
      await move.sheet.render(true);
    } else {
      event.preventDefault(); // Prevent default anchor behavior
      const removeButton = document.querySelector(
        `.remove-moves-btn[id='${move.id}']`,
      );
      let decription = document.querySelector(".second-row");
      let titleDiv = document.querySelector(`.first-row[id='${move.id}']`);
      if (!decription || !titleDiv) {
        const closestWindowApp = $(event.currentTarget).closest(".window-app");
        decription = closestWindowApp.find(".second-row")[0] || null; // Use the DOM element
        titleDiv = closestWindowApp.find(`.first-row[id='${move.id}']`)[0]; // Use the DOM element
      }

      if (decription === null) {
        const newElement = document.createElement("div");
        const moveBody = await sofh_Utility.renderTemplate(
          "systems/SofH/templates/tab/partial/moves-body-limited.hbs",
          move,
        );
        newElement.innerHTML = moveBody;
        titleDiv.insertAdjacentElement("afterend", newElement);
      } else {
        decription.remove(); // Remove the description element
      }
    }
  }

  async showMoves(event) {
    const moveType = event.target.id;
    if (moveType !== "") {
      const closestWindowApp = $(event.currentTarget).closest(".window-app");
      const movesElement = closestWindowApp.find(".all-moves." + moveType);

      if (movesElement.css("display") === "none") {
        movesElement.css("display", "");
      } else {
        movesElement.css("display", "none");
      }
    }
  }

  async collapsAllMoves(event) {
    const target = event.target.classList.value;
    const closestWindowApp = $(event.currentTarget).closest(".window-app");

    if (target === "moves active") {
      const movesElements = closestWindowApp
        .find(".all-moves")
        .not(".basicMoves");
      movesElements.css("display", "none");
    }
  }

  async rollForMove(event) {
    const button = event.target;
    let ID = button.id;
    if (ID === "") {
      ID = event.currentTarget.id;
    } //
    const item = this.actor.items.get(ID);
    const actor = this.actor;
    const clueRelated = item.system.cluerelated;
    const clueID = [];
    if (clueRelated) {
      const clueActors = Array.from(game.actors.entries()).filter(
        ([key, actor]) => actor.type === "clue",
      );

      clueActors.forEach((ID) => {
        let hasMatchingKey = Object.keys(ID[1].system.actorID).some(
          (key) => key === actor._id,
        );
        if (hasMatchingKey) {
          clueID.push(ID[0]);
        }
      });
    }
    const dialogInstance = new moveRoll(actor, item, clueID);
    dialogInstance.rollForMove(actor, item, clueID);
  }
  async showTimeToShine(ev) {
    const actor = this.actor;
    const updateData = {};
    const currentTS = actor.system.reputation.timeToShine;
    const house = actor.system.home.toLowerCase();
    const timeToShineText = game.i18n.localize(
      CONFIG.SOFHCONFIG.timeToShine[house + "TimeToShine"],
    );
    const content = `<div class="sofh"><h2 style="font-family: 'IM Fell English', serif;">${game.i18n.localize("sofh.ui.actor.timeToShine")}</h2>
        <p>${timeToShineText}</p></div>
        `;
    const title = game.i18n.localize("sofh.ui.actor.timeToShine");
    const moveToChat = `<div class="sofh description-sheet"> 
           <h2 class="move_type description-label-notrrolabe">${game.i18n.localize("sofh.ui.chat.use_move")}<br>
           ${game.i18n.localize("sofh.ui.actor.timeToShine")}</h2>       
            ${timeToShineText}
        </div>`;
    const d = new Dialog({
      title: title,
      content: content,
      buttons: {
        close: {
          label: `<div class ="sofh-button">${game.i18n.localize("sofh.ui.close")}</div>`,
          callback: () => {},
        },
        sendToChat: {
          label: `<div class ="sofh-button">${game.i18n.localize("sofh.ui.send_to_chat")}</div>`,
          callback: () => {
            ChatMessage.create({
              user: game.user.id,
              speaker: ChatMessage.getSpeaker({ actor }),
              content: moveToChat,
            });
            updateData["system.reputation.timeToShine"] = currentTS - 1;
            actor.update(updateData);
          },
        },
      },
      default: "close",
    });
    d.render(true, { height: 800, width: 450 });
  }

  async openMovesFromTriggers(event) {
    if (
      event.currentTarget.className === "moves-description-open" ||
      event.currentTarget.className === "send-to-chat-moves-btn"
    ) {
      const ID = event.currentTarget.id;
      const item = this.actor.items.get(ID);
      const title = item.name;
      const content = await sofh_Utility.renderTemplate(
        "systems/SofH/templates/dialogs/moves-body-limited.hbs",
        item,
      );
      const actor = this.actor;

      const moveToChat = `<div class="description-sheet"> 
           <h2 class="move_type description-label-notrrolabe">${game.i18n.localize("sofh.ui.chat.use_move")}<br>
           ${item.name}</h2>       
            <div class="chat-description">${item.system.description}</div>
        </div>`;
      const d = new Dialog({
        title: title,
        content: content,
        buttons: {
          close: {
            label: `<div class ="sofh-button">${game.i18n.localize("sofh.ui.close")}</div>`,
            callback: () => {},
            class: "my-button",
          },
          sendToChat: {
            label: `<div class ="sofh-button">${game.i18n.localize("sofh.ui.send_to_chat")}</div>`,
            callback: () => {
              ChatMessage.create({
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({ actor }),
                content: moveToChat,
              });
            },
          },
        },
        default: "close",
      });
      d.render(true, { height: 800, width: 450 });
    }
  }

  async changeYear(ev) {
    const schoolyear = Number(ev.target.value);
    await this.actor.update({
      ["system.changedYear"]: true,
      ["system.schoolyear.value"]: schoolyear,
    });
  }

  async changeReputationQuestions(ev) {
    const actor = this.actor;
    new ReputationQuestion(actor).render(true);
  }
  async _onDrop(event) {
    event.preventDefault();
    const data = event.dataTransfer;
    const actor = this.actor;
    if (data) {
      const droppedItem = JSON.parse(data.getData("text/plain"));
      const droppedType = droppedItem.type;
      if (droppedType === "Item") {
        const itemData = await fromUuid(droppedItem.uuid);
        const createdItems = await actor.createEmbeddedDocuments("Item", [
          itemData,
        ]);
        const createdItem = createdItems[0];
        if (
          itemData.type === "specialPlaybookMoves" &&
          itemData.system.action.isRealeted.isUse
        ) {
          const relatedMoves = itemData.system.relatedMoves ?? [];
          const actorItems = actor.items;
          const relatedNames = relatedMoves.map((n) => n.moves.toLowerCase());
          const affectedMoves = actorItems.filter((item) =>
            relatedNames.includes(item.name.toLowerCase()),
          );
          affectedMoves.forEach(async (move) => {
            let current = move.getFlag("SofH", "affectedby") || [];
            if (!Array.isArray(current)) current = [current]; // in case it was a single value
            if (!current.includes(createdItem.id)) {
              current.push(createdItem.id);
              await move.setFlag("SofH", "affectedby", current);
            }
          });
        }
        if (itemData.system.action.addFavoriteTopic.isUse) {
          const content = await sofh_Utility.renderTemplate(
            "systems/SofH/templates/dialogs/add-new-topic.hbs",
          );
          const addNewTopic = new foundry.applications.api.DialogV2({
            widnow: { title: game.i18n.localize("sofh.dilog.addNewTopic") },
            content,
            buttons: [
              {
                label: game.i18n.localize("sofh.UI.OK"),
                icon: "fa-solid fa-check",
                action: "ok",
                callback: async (event, html) => {
                  const selected =
                    html.offsetParent.querySelectorAll(".new-topic");
                  if (!selected) {
                    ui.notifications.warn(
                      game.i18n.localize("sofh.ui.selectOption"),
                    );
                    return false;
                  }
                  const choice1 = selected[0].selectedOptions[0].outerText;
                  const choice2 = selected[1].selectedOptions[0].outerText;
                  ChatMessage.create({
                    user: game.user.id,
                    speaker: game.user.name,
                    content: `${game.i18n.localize("sofh.dilog.addNewTopic")}: <b>${choice1}</b><br>
                    ${game.i18n.localize("sofh.dilog.addNewTopic2")}: <b>${choice2}</b><br>`,
                  });
                  const currentTopics =
                    this.actor.system?.additionalTopic ?? {};
                  let size = 0;
                  for (const [key, value] of Object.entries(currentTopics)) {
                    if (!value?.name || !value?.id) {
                      delete currentTopics[key];
                    }
                  }
                  if (currentTopics) {
                    size = Object.keys(currentTopics).length;
                  }
                  currentTopics[size] = {
                    name: selected[0].value,
                    id: createdItem.id,
                    type: "core",
                  };
                  currentTopics[size + 1] = {
                    name: selected[1].value,
                    id: createdItem.id,
                    type: "elective",
                  };
                  const updateData = {};
                  updateData["system.additionalTopic"] = currentTopics;
                  await this.actor.update(updateData);
                },
              },
            ],
            defaultButton: "ok",
          });
          addNewTopic.render(true, { width: 600 }).then(() => {
            const html = addNewTopic.element;
            const selects = html.querySelectorAll(".new-topic");
            const okButton = html.querySelector('button[data-action="ok"]');
            okButton.disabled = true;
            function checkValid() {
              const coreValue = selects[0].value;
              const electiveValue = selects[1].value;
              const valid =
                coreValue &&
                coreValue.trim() !== "" &&
                electiveValue &&
                electiveValue.trim() !== "";

              okButton.disabled = !valid;
            }
            selects.forEach((sel) =>
              sel.addEventListener("change", checkValid),
            );
          });
        }
      }
    }
  }
  async removeAdditionalTopic(ev) {
    const target = ev.target;
    const input = target.parentElement.previousElementSibling;
    const moveID = input.dataset.id;
    const actor = this.actor;
    const additionalTopic = foundry.utils.deepClone(
      actor.system.additionalTopic,
    );
    const move = await actor.items.get(moveID);
    const innerText = game.i18n.format("sofh.ui.dialog.deleteMoveAndTopic", {
      name: move?.name,
    });
    const removeTopic = new foundry.applications.api.DialogV2({
      widnow: { title: game.i18n.localize("sofh.dilog.removeTopic") },
      content: innerText,
      buttons: [
        {
          label: game.i18n.localize("sofh.UI.OK"),
          icon: "fa-solid fa-check",
          action: "ok",
          callback: async () => {
            const cleanedTopics = Array.from(additionalTopic).filter(
              (topic) => topic.id !== moveID,
            );
            await actor.update({ "system.additionalTopic": cleanedTopics });
            await actor.deleteEmbeddedDocuments("Item", [moveID]);
            actor.sheet.render(true);
          },
        },
      ],
      defaultButton: "ok",
    });
    removeTopic.render(true, { width: 600 });
  }

  async changeAditionalSubjectFromMove(ev) {
    const target = ev.target;
    const topicid = target.dataset.topicid;
    const id = target.dataset.id;
    const type = target.dataset.type;
    await this.actor.update({
      [`system.additionalTopic[${topicid}]`]: {
        type: type,
        name: target.value,
        id: id,
      },
    });
  }
}
