import sofh_Utility from "../utility.mjs";

const { api } = foundry.applications;

export class moveRoll extends api.HandlebarsApplicationMixin(
  api.ApplicationV2,
) {
  constructor(actor, item, clueID, options = {}) {
    super(options);
    this.actor = actor;
    this.item = item;
    this.clueID = clueID;
  }

  /* -------------------------------------------- */

  static DEFAULT_OPTIONS = {
    id: "move-roll",
    classes: ["roll-dialog"],
    tag: "div",
    window: {
      title: "Rolling",
      resizable: true,
    },
    position: { zIndex: 999 },
    actions: {
      toggleOther: moveRoll.#collapsOtherFactor,
      singleCheck: moveRoll.#allowOnlyOneAproach,
      rollMove: moveRoll.#rollForMove,
      selectMystery: moveRoll.#selectMystery,
    },
  };
  static PARTS = {
    main: {
      template: "systems/SofH/templates/dialogs/rolling-dialog.hbs",
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    context.item = this.item;
    context.clueID = this.clueID;
    context.clueIsArray = Array.isArray(this.clueID);
    if(!Array.isArray(this.clueID)){
      context.questionSelector = await this.addQuestionSelector(this.clueID);
    }else{
      context.questionSelector = null;
    }
    let relatedMoveIds = this.item.flags?.SofH?.affectedby || [];
    context.relatedMoves = relatedMoveIds;
    context.areRelatedMoves = relatedMoveIds.length > 0;
    return context;
  }
  static async #rollForMove(event) {
    event.preventDefault();
    const actor = this.actor;
    const item = this.item;
    const clueID = this.clueID;
    const questions = {};
    const html = event.target.offsetParent;
    if (
          item.system?.action?.addQuestion?.isUse &&
          Array.isArray(item.system?.additionalQuestion)
        ) {
          item.system.additionalQuestion.forEach((element, index) => {
            questions[index] = {
              description: element.question,
              impact: String(element.impact),
            };
          });
        }
 
    const solution = html.querySelector(".selection-mistery-solutions")?.selectedOptions[0]?.textContent;
    await this.defnieRollingFormula(actor, item, clueID, questions, solution, html);
    this.close();
  }

  static async #collapsOtherFactor(event, context) {
    const windowApp = event.target.offsetParent;
    const movesElement = windowApp.querySelector(".other-factor");
    const displyNone = movesElement.style.display === "none";
    movesElement.style.display = displyNone ? "" : "none";
  }

  static async #allowOnlyOneAproach(event, context) {
    const element = event.target.offsetParent;
        const checkboxes = element?.querySelectorAll(
      ".question-sheet-roll-muptiple, .circle-checkbox-isapply",
    );

    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        if (this.checked) {
          checkboxes.forEach((cb) => {
            if (cb !== this) {
              cb.checked = false;
            }
          });
        }
      });
    });
  }



  async _onRender(context, options) {
    await super._onRender(context, options);
    const element = this.element;
    const checkboxes = element?.querySelectorAll(
      ".question-sheet-roll-muptiple .circle-checkbox-isapply",
    );
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        if (this.checked) {
          checkboxes.forEach((cb) => {
            if (cb !== this) {
              cb.checked = false;
            }
          });
        }
      });
    });
    const complexityInput = element?.querySelector(".selection-mistery-solutions");
    if (complexityInput) {
      complexityInput.addEventListener("input", (event) => this.onChangeMystery(event));
    }
  }

  static async #selectMystery(event, context) {
    const selectedMystery = event.target.offsetParent.querySelector(".selection-mistery");
    const clueID = selectedMystery.selectedOptions[0].id;
    this.clueID = clueID;
    this.render(true);
  }

 async addQuestionSelector(clueID) {
  const clueSheet = game.actors.get(clueID);
  const solutions = clueSheet.system.solutions;

  const playerSolutions = Object.keys(solutions)
    .filter((key) => solutions[key].showToPlayer === true)
    .map((key) => solutions[key]);

  let selectHTML = `
    <div class="mistery-question">
      <label class="mistery-label">
        ${game.i18n.localize("sofh.dialog.select_mistery_question")}
      </label>
      <select class="selection-mistery-solutions">
        <option value="" selected></option>
  `;

  playerSolutions.forEach((solution) => {
    selectHTML += `
      <option value="${solution.question}" data-complexity="${solution.complexity}">
        ${solution.question}
      </option>
    `;
  });

  selectHTML += `
      </select>
    </div>
  `;

  return selectHTML;
}
onChangeMystery(event) {

  const app = event.target.offsetParent  
  const selectedOption = event.target.selectedOptions[0];
  if (!selectedOption) return;
  const complexity = selectedOption.dataset.complexity;
  const input = app.querySelector(".complexity-numer");
  if (!input) {
    console.warn("Complexity input not found");
    return;
  }
  input.value = complexity ?? 0;
}
 async defnieRollingFormula(actor, item, clueID, question, solution, html) {
    const selections = {
      houseApply: null,
      conditions: [],
      questions: [],
      relevantRelation: null,
      relevantString: null,
      numericModifier: null,
      otherrolltype: 0,
      oponentcondition: 0,
      advantages: 0,
    };
    let rollmod = 0;
    let dicenumber = 0;

    if (question === undefined) {
      question = html?.querySelector(".selection-mistery-solutions")[0]?.value;
    }

    const houseCheckbox = html?.querySelector(".circle-checkbox-housequestion");
    if (houseCheckbox) {
      selections.houseApply = houseCheckbox.checked;
      if (selections.houseApply) {
        rollmod = rollmod + 1;
      }
    }
    const oponentcondition = html?.querySelector(".oponent-have-condition-checkbox")
      ?.checked;
    if (oponentcondition) {
      selections.oponentcondition = oponentcondition;
      if (selections.oponentcondition) {
        dicenumber = dicenumber + 1;
      }
    }

    const conditionElements = html?.querySelectorAll(".conditions-roll-detail");

    conditionElements.forEach((condition) => {
      const isApply = condition.querySelector(
        ".circle-checkbox-isapply",
      ).checked;
      if (isApply) {
        selections.conditions.push({ isApply });
        dicenumber = dicenumber - 1;
      }
    });

    const questionElements = html?.querySelectorAll(".question-sheet-roll");
    questionElements.forEach((question) => {
      const impact =
        question.querySelector(".question-impact").value === "true";
      const isApply = question.querySelector(
        ".circle-checkbox-isapply",
      ).checked;
      if (isApply) {
        selections.questions.push({ impact, isApply });

        if (impact && isApply) {
          rollmod = rollmod + 1;
        } else if (!impact && isApply) {
          rollmod = rollmod - 1;
        }
      }
    });
    const aproachElements = html
      ?.querySelectorAll(".question-sheet-roll-muptiple");
    aproachElements.forEach((question) => {
      const impact =
        question.querySelector(".question-impact").value === "true";
      const isApply = question.querySelector(
        ".circle-checkbox-isapply",
      ).checked;
      if (isApply) {
        selections.questions.push({ impact, isApply });

        if (impact && isApply) {
          rollmod = rollmod + 1;
        } else if (!impact && isApply) {
          rollmod = rollmod - 1;
        }
      }
    });

    const relationSelect = html?.querySelector(".relation-chosen");
    if (relationSelect) {
      selections.relevantRelation = relationSelect[0].value;
      rollmod = rollmod + Number(relationSelect.value.split(":")[0]);
    }

    const stringsSelect = html?.querySelector(".roll-strings");
    if (stringsSelect) {
      selections.relevantString = stringsSelect[0].value;
      if (stringsSelect.value !== "") {
        dicenumber = dicenumber + 1;
      }
    }
    const advantagesSelect = html?.querySelector(".roll-advantages");
    if (advantagesSelect) {
      selections.relevantAdvantages = advantagesSelect[0].value;
      if (advantagesSelect.value !== "") {
        dicenumber = dicenumber + 1;
      }
    }
    const knownClue = html?.querySelectorAll(".circle-checkbox-isapply-clue");
    knownClue.forEach((knowClue) => {
      const isApply = knowClue.checked;
      if (isApply) {
        rollmod = rollmod + 1;
      }
    });
    let clueIDs = "";
    if (knownClue.length > 0) {
      const selection = html?.querySelector(".selection-mistery-solutions");
      if (selection !== null) {
        clueIDs = selection.value
      } else {
        clueIDs = clueID;
      }
    }

    const complexityValue = html?.querySelector(".complexity-numer");
    if (complexityValue !== null) {
      rollmod = rollmod - Number(complexityValue.value);
    }

    const numericInput = html?.querySelector(".numeric-mod");
    selections.numericModifier = numericInput ? numericInput[0].value : null;
    const otherMod = Number(selections.numericModifier);
    rollmod = rollmod + otherMod;
    selections.otherrolltype = html?.querySelector('[name="ad-disad"]')?.value;
    let diceMod = Number(selections.otherrolltype);
    if (diceMod > 3) {
      diceMod = 3;
    } else if (diceMod < -3) {
      diceMod = -3;
    }

    dicenumber = dicenumber + diceMod;
    let formula = "2d6";
    if (rollmod.toString() > 0) {
      formula = "2d6 + " + rollmod.toString();
    } else if (rollmod.toString() < 0) {
      formula = "2d6" + rollmod.toString();
    }

    if (dicenumber > 0) {
      formula = "3d6kh2";
      if (rollmod.toString() > 0) {
        formula = "3d6kh2 +" + rollmod.toString();
      } else if (rollmod.toString() < 0) {
        formula = "3d6kh2" + rollmod.toString();
      }
    } else if (dicenumber < 0) {
      formula = "3d6kl2";
      if (rollmod.toString() > 0) {
        formula = "3d6kl2 +" + rollmod.toString();
      } else if (rollmod.toString() < 0) {
        formula = "3d6kl2" + rollmod.toString();
      }
    }
    const element = html;
    const riseResults = element.querySelectorAll(".riseResult");
    let stepOfRise = [];
    let complication = [];
    let i = 0;
    let unUsedRise = [];
    riseResults.forEach(async (riseResult) => {
      const isApply = riseResult.querySelector(".circle-checkbox-isapply");
      if (isApply.checked) {
        stepOfRise[i] = {
          moveid: isApply.dataset.moveId,
          name: isApply.dataset.name,
        };
        complication[i] = await this.checkComplication(
          isApply.dataset.moveId,
          actor,
        );
      } else {
        unUsedRise[i] = isApply.dataset.moveid;
      }
      i++;
    });
    const modifyEffects = element.querySelectorAll(".modifyEffect");
    let usedRelatedMove = [];
    i = 0;
    modifyEffects.forEach((modifyEffect) => {
      const isApply = modifyEffect.querySelector(".circle-checkbox-isapply");
      if (isApply.checked) {
        const moveID = isApply.dataset.moveid;
        usedRelatedMove[i] = moveID;
        i++;
      }
    });

    await this.rolling(
      actor,
      item,
      formula,
      clueIDs,
      question,
      solution,
      advantagesSelect?.value,
      stepOfRise,
      usedRelatedMove,
      complication,
      unUsedRise,
    );
    if (stringsSelect !== null) {
      if (stringsSelect.value !== "") {
        this.removeStrinAfterRoll(stringsSelect.value);
      }
      if (advantagesSelect !== null) {
        if (advantagesSelect.value !== "") {
          this.removeAdvantageAfterRoll(advantagesSelect.value);
        }
      }
    }
  }

    async rolling(
    actor,
    item,
    formula,
    clueID,
    question,
    solution,
    advantagesSelect,
    stepOfRise,
    usedRelatedMove,
    complication,
    unUsedRise,
  ) {
    const rollResult = await new Roll(formula).evaluate();
    const total = rollResult.total;
    const label = item.name;
    let content = "";
    let resultTier = "";
    if (total >= 12 && item.system?.above12 !== undefined) {
      resultTier = "above12";
    } else if (total >= 10) {
      resultTier = "above10";
    } else if (total >= 7 && total <= 9) {
      resultTier = "7to9";
    } else {
      resultTier = "below7";
    }

    // Apply the step-raising logic
    if (stepOfRise.length > 0) {
      stepOfRise.forEach(async (move) => {
        const moveItem = await actor.items.get(move.moveid);
        const riseBelow7To7to9 = moveItem.system.action.riseRollResults["7to9"];
        const rise7to9ToAbove10 =
          moveItem.system.action.riseRollResults.above10;
        const riseAbove10ToAbove12 =
          moveItem.system.action.riseRollResults.above12;
        if (riseBelow7To7to9 && resultTier === "below7") {
          resultTier = "7to9";
        } else if (rise7to9ToAbove10 && resultTier === "7to9") {
          resultTier = "above10";
        } else if (
          riseAbove10ToAbove12 &&
          resultTier === "above10" &&
          item.system?.above12
        ) {
          resultTier = "above12";
        }
      });
    }

    // Then set the content
    switch (resultTier) {
      case "above12":
        content = item.system?.above12 || "No content for above 12.";
        break;
      case "above10":
        content = item.system?.above10 || "No content for above 10.";
        break;
      case "7to9":
        content = item.system?.["7to9"] || "No content for 7 to 9.";
        break;
      default:
        content = item.system?.below7 || "No content for below 7.";
    }
    usedRelatedMove.forEach((move) => {
      const moveItem = actor.items.get(move);
      const header = `<br>${game.i18n.format("sofh.ui.chat.additionalResults", { name: moveItem.name })}<br>`;
      switch (resultTier) {
        case "above12":
          content += moveItem.system?.resultsChange.above12
            ? header + moveItem.system.resultsChange.above12
            : "";
          break;
        case "above10":
          content += moveItem.system?.resultsChange.above10
            ? header + moveItem.system.resultsChange.above10
            : "";
          break;
        case "7to9":
          content += moveItem.system?.resultsChange["7to9"]
            ? header + moveItem.system.resultsChange["7to9"]
            : "";
          break;
        default:
          content += moveItem.system?.resultsChange.below7
            ? header + moveItem.system.resultsChange.below7
            : "";
      }
    });
    if (stepOfRise.length > 0) {
      let i = 0;
      stepOfRise.forEach((move) => {
        content +=
          `<br>` +
          game.i18n.format("sofh.ui.chat.relatedMoveRiseEffect", {
            name: move.name,
          }) +
          `<br>`;

        if (complication[i]) {
          content += game.i18n.format(
            "sofh.ui.chat.relatedMoveCauseComplication",
            { name: move },
          );
        }
        i++;
      });
    }
    if (Object.keys(question).length === 0) {
      content = `
          <div class="sofh">
          <h3 style="font-family: 'IM Fell English SC', serif;font-size: large;">${label}</h3><br>
          <div class="move-description-chat">${item.system.description}</div><br>
          <h2 class="move_type description-label ">${game.i18n.localize("sofh.ui.chat.rollesult")}</h2>  
          <div class="roll-results">${content}</div><br>
          </div>
      `;
    } else {
      const questionlabel = game.i18n.localize("sofh.ui.chat.mystery_question");

      content = `
          <div class="sofh">
        
            <h3 style="font-family: 'IM Fell English SC', serif;font-size: large;">${label}</h3><br>
            <div class="move-description-chat">${item.system.description}</div><br>
              <h3></h3>
              <div class="mistery-question_solution">
                <p>${questionlabel}${question}</p>
              </div>
              <h2 class="move_type description-label ">${game.i18n.localize("sofh.ui.chat.rollesult")}</h2>  
              <div class="roll-results">${content}</div><br>
            </div>
      `;
    }
    if (advantagesSelect) {
      content += `
      <h3></h3>
      <p style="font-family: 'IM Fell English SC', serif">${game.i18n.format("sofh.ui.chat.actorUseAdvantages", { actor: actor.name, advantage: advantagesSelect })}</p>
      </div>`;
    } else {
      content += `</div>`;
    }
    if (unUsedRise.length !== 0) {
      unUsedRise.forEach((moveID, index) => {
        const reladedMove = actor.items.get(moveID);
        const flag = reladedMove.flags?.SofH?.complication;
        let complication = false;
        if (flag === undefined) {
          reladedMove.setFlag("SofH", "complication.usedtime", new Date());
          reladedMove.setFlag("SofH", "complication.useNumber", 1);
          complication = false;
        } else {
          const delta = new Date() - new Date(flag);
          const useCount = flag.useNumber + 1;
          const twelveHours = 12 * 60 * 60 * 1000;
          reladedMove.setFlag("SofH", "complication.useNumber", useCount);
          if (
            delta < twelveHours &&
            useCount === reladedMove.system.action.riseRollResults.useNumber
          ) {
            complication = true;
          } else if (delta > twelveHours) {
            reladedMove.setFlag("SofH", "complication.usedtime", new Date());
            reladedMove.setFlag("SofH", "complication.useNumber", 1);
          }
          complication = false;
        }
        content += `<br>
    <button class="rise-with-move" data-id="${index}">${game.i18n.format("sofh.ui.chat.useMoveToRiseResult", { name: reladedMove.name })}</button> <br>`;
      });
    }
    rollResult.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: content,
      system: {
        unUsedRise: unUsedRise,
        actor: actor.id,
        move: item.id,
        resultTier: resultTier,
        roll: rollResult,
        flavor: content,
      },
    });
    if (rollResult.total < 6 && clueID !== "") {
      const clue = game.actors.get(clueID);
      if (game.user.isGM) {
        for (let actorKey in clue.system.actorID) {
          const actorId = clue.system.actorID[actorKey].id;
          const memberActor = game.actors.get(actorId);
          const xpValues = memberActor.system.xp.value;
          let lastTrueKey = null;
          for (let key in xpValues) {
            if (xpValues[key] === true) {
              lastTrueKey = key;
            } else {
              memberActor.update({ [`system.xp.value.${key}`]: true });
              break;
            }
          }
        }
      } else {
        game.system.socketHandler.emit("SofH", {
          operation: "updateXPfromCule",
          clue: clue,
        });
      }
    } else if (rollResult.total < 7) {
      const xpValues = actor.system.xp.value;
      let lastTrueKey = null;
      for (let key in xpValues) {
        if (xpValues[key] === true) {
          lastTrueKey = key;
        } else {
          actor.update({ [`system.xp.value.${key}`]: true });
          break;
        }
      }
    }
  }
    async removeStrinAfterRoll(stringName) {
    const strings = this.actor.system.strings;
    for (const key in strings) {
      if (strings[key].name === stringName) {
        delete strings[key];
        break;
      }
    }

    await this.actor.update({ "system.strings": [{}] });
    await this.actor.update({ "system.strings": strings });
  }

  async removeAdvantageAfterRoll(advanatageDes) {
    const advanatage = this.actor.system.advantage;
    for (const key in advanatage) {
      if (advanatage[key].description === advanatageDes) {
        delete advanatage[key];
        break;
      }
    }

    const reindexed = {};
    advanatage.forEach(([_, value], index) => {
      reindexed[index] = value;
    });

    await this.actor.update({
      "system.advantage": reindexed,
    });
  }
}
