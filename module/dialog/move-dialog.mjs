import sofh_Utility from "../utility.mjs";

export class moveRoll extends Dialog {
  constructor(actor, item, clueID) {
    super(actor, item, clueID);
    ((this.actor = actor), (this.item = item), (this.clueID = clueID));
  }

  async activateListeners(html) {
    super.activateListeners(html);
    html.on("click", ".other-factor-h3", this.collapsOtherFactor.bind(this));
    html.on(
      "change",
      ".question-sheet-roll-muptiple .circle-checkbox-isapply",
      this.allowOnlyOneAproach.bind(this),
    );
    html.on("change", ".selection-mistery", (event) => {
      this.showKnowClue(event);
    });
    html.on("change", ".selection-mistery-solutions", (event) => {
      this.assigneComplexity(event);
    });
  }

  async allowOnlyOneAproach() {
    const checkboxes = document?.querySelectorAll(
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
  }

  async collapsOtherFactor(event) {
    event.preventDefault();

    // Find the element with the class "other-factor" relative to the current context
    const movesElement = $(event.currentTarget)
      .closest(".window-app")
      .find(".other-factor");

    if (movesElement.css("display") === "none") {
      movesElement.css("display", "");
      $(".window-app").each(function () {
        const windowTitle = $(this).find(".window-title").text().trim();
        if (windowTitle === game.i18n.localize("sofh.ui.rolling")) {
          $(this).css("top", (index, currentTop) => {
            return `${parseInt(currentTop, 10) - 200}px`;
          });
        }
      });
    } else {
      movesElement.css("display", "none");
      $(".window-app").each(function () {
        const windowTitle = $(this).find(".window-title").text().trim();
        if (windowTitle === game.i18n.localize("sofh.ui.rolling")) {
          $(this).css("top", (index, currentTop) => {
            return `${parseInt(currentTop, 10) + 200}px`;
          });
        }
      });
    }

    // Handle the text change for the header
    const h3Element = event.currentTarget;
    const originalText = game.i18n.localize("sofh.ui.dialog.other_factor");
    const newText = game.i18n.localize("sofh.ui.dialog.other_factor_close");

    if (h3Element.textContent === originalText) {
      h3Element.textContent = newText;
    } else {
      h3Element.textContent = originalText;
    }
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
      question = html?.find(".selection-mistery-solutions")[0]?.value;
    }

    const houseCheckbox = html?.find(".circle-checkbox-housequestion")[0];
    if (houseCheckbox) {
      selections.houseApply = houseCheckbox.checked;
      if (selections.houseApply) {
        rollmod = rollmod + 1;
      }
    }
    const oponentcondition = html?.find(".oponent-have-condition-checkbox")[0]
      ?.checked;
    if (oponentcondition) {
      selections.oponentcondition = oponentcondition;
      if (selections.oponentcondition) {
        dicenumber = dicenumber + 1;
      }
    }

    const conditionElements = html?.find(".conditions-roll-detail").toArray();
    conditionElements.forEach((condition) => {
      const isApply = condition.querySelector(
        ".circle-checkbox-isapply",
      ).checked;
      if (isApply) {
        selections.conditions.push({ isApply });
        dicenumber = dicenumber - 1;
      }
    });

    const questionElements = html.find(".question-sheet-roll").toArray();
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
      ?.find(".question-sheet-roll-muptiple")
      .toArray();
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

    const relationSelect = html?.find(".relation-chosen")[0];
    if (relationSelect) {
      selections.relevantRelation = relationSelect.value;
      rollmod = rollmod + Number(relationSelect.value.split(":")[0]);
    }

    const stringsSelect = html?.find(".roll-strings")[0];
    if (stringsSelect) {
      selections.relevantString = stringsSelect.value;
      if (stringsSelect.value !== "") {
        dicenumber = dicenumber + 1;
      }
    }
    const advantagesSelect = html?.find(".roll-advantages")[0];
    if (advantagesSelect) {
      selections.relevantAdvantages = advantagesSelect.value;
      if (advantagesSelect.value !== "") {
        dicenumber = dicenumber + 1;
      }
    }
    const knownClue = html?.find(".circle-checkbox-isapply-clue").toArray();
    knownClue.forEach((knowClue) => {
      const isApply = knowClue.checked;
      if (isApply) {
        rollmod = rollmod + 1;
      }
    });
    let clueIDs = "";
    if (knownClue.length > 0) {
      const selection = html?.find(".selection-mistery")[0];
      if (selection !== undefined) {
        const selectedOption = selection.querySelector("option:checked");
        clueIDs = selectedOption.id;
      } else {
        clueIDs = clueID;
      }
    }

    const complexityValue = html?.find(".complexity-numer")[0]?.value;
    if (complexityValue !== undefined) {
      rollmod = rollmod - Number(complexityValue);
    }

    const numericInput = html?.find(".numeric-mod")[0];
    selections.numericModifier = numericInput ? numericInput.value : null;
    const otherMod = Number(selections.numericModifier);
    rollmod = rollmod + otherMod;
    selections.otherrolltype = html?.find('[name="ad-disad"]')[0]?.value;
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

    await this.rolling(
      actor,
      item,
      formula,
      clueIDs,
      question,
      solution,
      advantagesSelect?.value,
    );
    if (stringsSelect !== undefined) {
      if (stringsSelect.value !== "") {
        this.removeStrinAfterRoll(stringsSelect.value);
      }
      if (advantagesSelect !== undefined) {
        if (advantagesSelect.value !== "") {
          this.removeAdvantageAfterRoll(advantagesSelect.value);
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
    const advanatage = this.actor.system.advanatage;
    for (const key in advanatage) {
      if (advanatage[key].description === advanatageDes) {
        delete advanatage[key];
        break;
      }
    }

    await this.actor.update({ "system.advanatage": [{}] });
    await this.actor.update({ "system.advanatage": advanatage });
  }

  async rolling(
    actor,
    item,
    formula,
    clueID,
    question,
    solution,
    advantagesSelect,
  ) {
    const rollResult = await new Roll(formula).evaluate();
    const total = rollResult.total;
    const label = item.name;
    let content = "";
    if (total >= 10) {
      content = item.system?.above10 || "No content for above 10.";
    } else if (total >= 7 && total <= 9) {
      content = item.system?.["7to9"] || "No content for 7 to 9.";
    } else {
      content = item.system?.below7 || "No content for below 7.";
    }
    if (total >= 12 && item.system?.above12 !== undefined) {
      content = item.system.above12;
    }
    if (question === undefined) {
      content = `
          <div class="sofh">
          <h3 style="font-family: 'IM Fell English SC', serif;font-size: large;">${label}</h3><br>
          <div class="move-description-chat">${item.system.description}</div><br>
          <h2 class="move_type description-label ">${game.i18n.localize("sofh.chat.rollesult")}</h2>  
          <div class="roll-results">${content}</div><br>
          </div>
      `;
    } else {
      const questionlabel = game.i18n.localize("sofh.chat.mystery_question");

      content = `
          <div class="sofh">
        
            <h3 style="font-family: 'IM Fell English SC', serif;font-size: large;">${label}</h3><br>
            <div class="move-description-chat">${item.system.description}</div><br>
              <h3></h3>
              <div class="mistery-question_solution">
                <p>${questionlabel}${question}</p>
              </div>
              <h2 class="move_type description-label ">${game.i18n.localize("sofh.chat.rollesult")}</h2>  
              <div class="roll-results">${content}</div><br>
            </div>
      `;
    }
    if (advantagesSelect !== undefined) {
      content += `
      <h3></h3>
      <p style="font-family: 'IM Fell English SC', serif>${game.i18n.format("sofh.chat.actorUseAdvantages", { actor: actor.name, advantage: advantagesSelect })}</p>
      </div>`;
    } else {
      content += `</div>`;
    }

    rollResult.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: content,
    });
    if (rollResult.total < 6 && clueID !== "") {
      const clue = game.actors.get(clueID);
      if (game.user.isGM) {
        for (let actorKey in clue.system.actorID) {
          const memberActor = game.actors.get(actorKey);
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
        game.socket.emit("system.SofH", {
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

  async rollForMove(
    actor,
    item,
    clueID,
    complexity,
    question,
    solution,
    sheet,
  ) {
    const is7conditions = actor.system.is7conditions;
    if (complexity === undefined) {
      complexity = 0;
    }
    if (!is7conditions) {
      let content = await sofh_Utility.renderTemplate(
        "systems/SofH/templates/dialogs/rolling-dialog.hbs",
        {
          item: item,
          actor: actor,
          clueID: clueID,
          complexity: complexity,
          question: question,
        },
      );
      if (typeof clueID === "string" && question === undefined) {
        const clueSheet = game.actors.get(clueID);
        const selectElementSolution = await addQuestionSelector(clueSheet);
        const selectElementSolutionHTML = selectElementSolution.outerHTML;
        content = content.replace(
          '<div class="complexity">',
          `${selectElementSolutionHTML}<div class="complexity">`,
        );
      }
      new moveRoll({
        data: { actor, item, clueID },
        title: game.i18n.localize("sofh.ui.rolling"),
        content,
        buttons: {
          OK: {
            icon: '<i class="fa fa-check"></i>',
            label: `<div class="sofh-button">${game.i18n.localize("sofh.UI.Roll")}</div>`,
            callback: async (html) => {
              await this.defnieRollingFormula(
                actor,
                item,
                clueID,
                solution,
                question,
                html,
              );
            },
          },
        },
        default: `<div class="sofh-button">${game.i18n.localize("sofh.UI.Roll")}</div>`,
      }).render(true);
    } else {
      ui.notifications.warn(
        game.i18n.localize("sofh.ui.warrning.cannotactduetoconditions"),
      );
    }
  }

  async showKnowClue(event) {
    const existingClueElements = event.currentTarget
      .closest(".dialog")
      .querySelectorAll(".single-clue, .complexity");
    existingClueElements.forEach((element) => element.remove());
    const target = event.currentTarget.selectedOptions[0].id;
    let selectElementSolution = null;
    const actorId = this.data.data.actor._id;
    const clueSheet = game.actors.get(target);
    if (clueSheet !== undefined) {
      const clueDescription = clueSheet.system.clue;
      const actorClue = clueSheet.system.actorID[actorId];
      let html = "";
      Object.keys(actorClue).forEach((key) => {
        if (key.startsWith("have") && actorClue[key] === true) {
          const index = key.slice(4);
          if (clueDescription.hasOwnProperty(index)) {
            html += ` 
              <div class="single-clue">
                <label class="known-clue-label">${clueDescription[index].description}</label>
                <input type="checkbox" class="circle-checkbox-isapply-clue">
              </div>`;
          }
        }
      });
      if (html !== "") {
        selectElementSolution = await addQuestionSelector(clueSheet);

        html += `
          <div class="complexity">
            <label class="complexity-label">${game.i18n.localize("sofh.ui.complexity_value")}</label>
            <input type="number" class="complexity-numer" value="0"></input>
          </div>`;
      }
      html = selectElementSolution?.outerHTML + html;
      const clueSelector = event.currentTarget
        .closest(".dialog")
        .querySelector(".clue-slector");
      clueSelector.insertAdjacentHTML("afterend", html);
    }
  }

  async assigneComplexity(event) {
    event.preventDefault();
    const selestedQuestion = event.target.options[event.target.selectedIndex];
    const complexity = Number(selestedQuestion.id);
    const complexityInput = event.target
      .closest(".known-clue")
      .querySelector(".complexity-numer");
    complexityInput.value = complexity;
  }
}

async function addQuestionSelector(clueSheet) {
  const solutions = clueSheet.system.solutions;
  const playerSolutions = Object.keys(solutions)
    .filter((key) => solutions[key].showToPlayer === true)
    .map((key) => solutions[key]);
  let selectElementSolution = document.createElement("select");
  selectElementSolution.classList.add("selection-mistery-solutions");

  playerSolutions.forEach((solution, index) => {
    let optionElement = document.createElement("option");
    optionElement.value = solution.question;
    optionElement.textContent = solution.question;
    optionElement.id = solution.complexity;
    selectElementSolution.appendChild(optionElement);
  });
  let blankOption = document.createElement("option");
  blankOption.value = "";
  blankOption.textContent = "";
  blankOption.selected = true;
  selectElementSolution.prepend(blankOption);

  let misteryQuestionDiv = document.createElement("div");
  misteryQuestionDiv.classList.add("mistery-question");

  const misteryLabel = document.createElement("label");
  misteryLabel.textContent = game.i18n.localize(
    "sofh.dialog.select_mistery_question",
  );
  misteryLabel.classList.add("mistery-label");
  misteryQuestionDiv.appendChild(misteryLabel);
  misteryQuestionDiv.appendChild(selectElementSolution);

  return misteryQuestionDiv;
}
