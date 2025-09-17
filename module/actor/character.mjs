import { moveRoll } from "../dialog/move-dialog.mjs";
import sofh_Utility from "../utility.mjs";


const BaseActorSheet = (typeof foundry?.appv1?.sheets?.ActorSheet !== "undefined") ? foundry.appv1.sheets.ActorSheet : ActorSheet;
export class  sofhCharacterSheet extends BaseActorSheet {
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
    });

    async function enrich(html) {
      if (html) {
        if(game.release.generation < 13 ){
          return await TextEditor.enrichHTML(html, {
            secrets: context.actor.isOwner,
            async: true,
          });

        }
        else{
        return await  foundry.applications.ux.TextEditor.enrichHTML(html, {
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
    html.on("click", ".remove-advanatage-btn", (ev) => this.removeAdvantageItem(ev));
    html.on("click", ".move_type", (ev) => this.showMoves(ev));
    html.on("click", ".moves", (ev) => this.collapsAllMoves(ev));
    html.on("click", ".remove-moves-btn", (ev) => this.removeMoves(ev));
    html.on("click contextmenu",".moves-edit",(ev) => this.openMoves(ev));
    html.on("click",".roll-moves-btn",(ev) => this.rollForMove(ev));
    html.on("click",".moves-description-open",(ev) => this.openMovesFromTriggers(ev));
    html.on("click",".send-to-chat-moves-btn", (ev) => this.openMovesFromTriggers(ev));
    html.on("click", ".time_to_shine", (ev) => this.showTimeToShine(ev));
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
      const content = await sofh_Utility.renderTemplate(
        "systems/SofH/templates/dialogs/xp.hbs",
      );
      new Dialog({
        title: game.i18n.localize("sofh.ui.gainxp"),
        content,
        buttons: {
          OK: {
            icon: '<i class="fa fa-check"></i>',
            label:`<div class ="sofh-button">${game.i18n.localize("sofh.UI.OK")}</div>`
        
          },
        },
        default: "OK",
      }).render(true);
    }
  }

  async removeMoves(ev) {
    const button = ev.target.closest(".remove-moves-btn");
    const ID = button.id;
    const item = this.actor.items.get(ID);    
    const innerText = game.i18n.format("sofh.ui.dialog.deleteMove",{name:item.name})
    const d = new Dialog({
      title: game.i18n.format("sofh.ui.dialog.deleteMoveTitle",{name:item.name}), 
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
          }
        },
        cancel: {
          label: game.i18n.localize("Cancel"),
          callback: () => {
              ui.notifications.info("Deletion canceled.");
          }
        }
      },
      default: "cancel", 
      close: () => {
      }
    });
    d.render(true);
    
  }

  async handleHouseChange(ev) {
    const house = ev.target.value;
    if (house !== "") {
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
    const goal = game.i18n.localize(`sofh.ui.actor.goal${house}`);
    await actor.update({
      "system.goal": goal,
      "system.home": game.i18n.localize(`sofh.ui.actor.${house}`).toLowerCase(),
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
            const selectedQuestion = html.find('input[name="housequestion"]:checked');
            
            // Check if an option is selected
            if (selectedQuestion.length === 0) {
              ui.notifications.warn(game.i18n.localize("sofh.ui.notSelectedHouseQuestion"));
              this.assignHouseQuestions(house,changeHouse)
              
                    }
            else{
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
        h => h.name?.toLowerCase().replace(/\s+/g, "_") === houseKey
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
      await this.actor.update({ "system.housequestion": selectedLabel });
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
    } 
    else {
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
      const movesElements = closestWindowApp.find(".all-moves").not(".basicMoves");
      movesElements.css("display", "none");
    }
  }
  


  async rollForMove(event) {
    const button = event.target;
    let ID = button.id;
    if (ID === "") {
      ID = event.currentTarget.id;
    }//
    const item = this.actor.items.get(ID);
    const actor = this.actor;
    const clueRelated = item.system.cluerelated;
    const clueID = [];
    if(clueRelated){
      const clueActors = Array.from(game.actors.entries()).filter(
        ([key, actor]) => actor.type === "clue");
      
       clueActors.forEach(ID =>{
        let hasMatchingKey = Object.keys(ID[1].system.actorID).some(key => key === actor._id);
        if(hasMatchingKey){
        clueID.push(ID[0])
        }
       })
      
    }
   const dialogInstance = new moveRoll(actor, item, clueID);
    dialogInstance.rollForMove(actor, item, clueID);
  }
  async showTimeToShine(ev) {
    const actor = this.actor;
    const updateData = {};
    const currentTS = actor.system.reputation.timeToShine;
    const house = actor.system.home.toLowerCase();
    const content = `<div class="sofh"><h2 style="font-family: 'IM Fell English', serif;">${game.i18n.localize("sofh.ui.actor.timeToShine")}</h2>
        <p>${game.i18n.localize(`sofh.ui.actor.${house}TimeToShine`)}</p></div>
        `;
    const title = game.i18n.localize("sofh.ui.actor.timeToShine");
    const moveToChat = `<div class="sofh description-sheet"> 
           <h2 class="move_type description-label-notrrolabe">${game.i18n.localize("sofh.ui.chat.use_move")}<br>
           ${game.i18n.localize("sofh.ui.actor.timeToShine")}</h2>       
            ${game.i18n.localize(`sofh.ui.actor.${house}TimeToShine`)}
        </div>`;
    const d = new Dialog({
      title: title,
      content: content,
      buttons: {
        close: {
          label: `<div class ="sofh-button">${game.i18n.localize("sofh.ui.close")}</div>`,
          callback: () => {}
        },
        sendToChat: {
          label:`<div class ="sofh-button">${game.i18n.localize("sofh.ui.send_to_chat")}</div>`,
          callback: () => {
            ChatMessage.create({
              user: game.user.id,
              speaker: ChatMessage.getSpeaker({ actor }),
              content: moveToChat,
            });
            updateData["system.reputation.timeToShine"] = currentTS - 1;
            actor.update(updateData);
          }
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
            }
          },
        },
        default: "close",
      });
      d.render(true, { height: 800, width: 450 });
    }
  }
}

