export class moveRoll extends Dialog {
  constructor(actor, item, clueID) {
    super(actor, item, clueID);
    (this.actor = actor), (this.item = item), (this.clueID = clueID);
  }
  async activateListeners(html) {
    super.activateListeners(html);
    html.on("click", ".other-factor-h3", this.collapsOtherFactor.bind(this));
    html.on("change", ".question-sheet-roll-muptiple .circle-checkbox-isapply", this.allowOnlyOneAproach.bind(this));
    html.on("change", ".selection-mistery", (event) => {
      this.showKnowClue(event); // Pass `this.actor` to the method
    });
  }
  async allowOnlyOneAproach(){
    const checkboxes = document.querySelectorAll(".question-sheet-roll-muptiple .circle-checkbox-isapply");

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener("change", function () {
                if (this.checked) {
                    // Uncheck all other checkboxes in 'question-sheet-roll-muptiple' group
                    checkboxes.forEach(cb => {
                        if (cb !== this) {
                            cb.checked = false;
                        }
                    })
                }
            })
        })
  }

  async collapsOtherFactor(event) {
    event.preventDefault();
    const movesElement = $(".other-factor");
    if (movesElement.css("display") === "none") {
      movesElement.css("display", "");
      $(".window-app").each(function () {
        const windowTitle = $(this).find(".window-title").text().trim();
        if (windowTitle === game.i18n.localize("sofh.ui.rolling")) {
          // Move the window up by 200px
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
          // Move the window up by 200px
          $(this).css("top", (index, currentTop) => {
            return `${parseInt(currentTop, 10) + 200}px`;
          });
        }
      });

    }

    const h3Element = event.currentTarget;

    const originalText = game.i18n.localize("sofh.ui.dialog.other_factor");
    const newText = game.i18n.localize("sofh.ui.dialog.other_factor_close");

    // Step 4: Check current content and toggle
    if (h3Element.textContent === originalText) {
      h3Element.textContent = newText;
    } else {
      h3Element.textContent = originalText;
    }
  }
  async defnieRollingFormula(actor, item, clueID) {
    const selections = {
      houseApply: null,
      conditions: [],
      questions: [],
      relevantRelation: null,
      relevantString: null,
      numericModifier: null,
      otherrolltype: 0,
      oponentcondition: 0,
    };
    let rollmod = 0;
    let dicenumber = 0;

    const houseCheckbox = document.querySelector(
      ".circle-checkbox-housequestion",
    );
    if (houseCheckbox) {
      selections.houseApply = houseCheckbox.checked;
      if (selections.houseApply) {
        rollmod = rollmod + 1;
      }
    }
    const oponentcondition = document.querySelector(
      ".oponent-have-condition-checkbox",
    ).checked;
    if (oponentcondition) {
      selections.oponentcondition = houseCheckbox.oponentcondition;
      if (selections.oponentcondition) {
        dicenumber = dicenumber + 1;
      }
    }

    const conditionElements = document.querySelectorAll(
      ".conditions-roll-detail",
    );
    conditionElements.forEach((condition) => {
      const isApply = condition.querySelector(
        ".circle-checkbox-isapply",
      ).checked;
      if (isApply) {
        selections.conditions.push({ isApply });
        dicenumber = dicenumber - 1;
      }
    });

    const questionElements = document.querySelectorAll(".question-sheet-roll");
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
    const aproachElements = document.querySelectorAll(".question-sheet-roll-muptiple");
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

    const relationSelect = document.querySelector(".relation-chosen");
    if (relationSelect) {
      selections.relevantRelation = relationSelect.value;
      rollmod = rollmod + Number(relationSelect.value);
    }

    const stringsSelect = document.querySelector(".roll-strings");
    if (stringsSelect) {
      selections.relevantString = stringsSelect.value;
      if (stringsSelect.value !== "") {
        dicenumber = dicenumber + 1;
      }
    }
    const knownClue = document.querySelectorAll(".circle-checkbox-isapply-clue");
    knownClue.forEach((knowClue)=>{
      const isApply = knowClue.checked;
      if(isApply){
        rollmod = rollmod + 1;
      }
    })
    let clueIDs = "";
    if (knownClue.length > 0) {
      const selection = document.querySelector(".selection-mistery"); 
      if(selection !== null){
      const selectedOption = selection.querySelector("option:checked"); 
      clueIDs =selectedOption.id
      }
      else{
        clueIDs=clueID;
      }
    
    }

    const complexityValue =  document.querySelector(".complexity-numer")?.value;
    if (complexityValue !== undefined){
    rollmod = rollmod - Number(complexityValue)
    }

    const numericInput = document.querySelector(".numeric-mod");
    selections.numericModifier = numericInput ? numericInput.value : null;
    const otherMod = Number(selections.numericModifier);
    rollmod = rollmod + otherMod;
    selections.otherrolltype =
      document.querySelector('[name="ad-disad"]').value;
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
    
    await this.rolling(actor, item, formula, clueIDs);
    if(stringsSelect !== null){
    if (stringsSelect.value !== "") {
      this.removeStrinAfterRoll(stringsSelect.value);
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

  async rolling(actor, item, formula, clueID) {
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

    content = `
          <div class="sofh">
          <h3 style="font-family: 'IM Fell English SC', serif;font-size: large;">${label}</h3><br>
          <div class="move-description-chat">${item.system.description}</div><br>
          <h2 class="move_type description-label ">${game.i18n.localize("sofh.chat.rollesult")}</h2>  
          <div class="roll-results">${content}</div><br>
          </div>
      `;

    rollResult.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: content,
    });
    if(rollResult.total< 6 && clueID !== ""){
      const clue = game.actors.get(clueID);
      for (let actorKey in clue.system.actorID) {
        // Get the corresponding actor object using the key
        const memberActor = game.actors.get(actorKey);
        const xpValues = memberActor.system.xp.value;
        let lastTrueKey = null;
        for (let key in xpValues) {
            if (xpValues[key] === true) {
                lastTrueKey = key;
            }
            else{
              memberActor.update({[`system.xp.value.${key}`]: true})
              break
            }

        }

      }
    }
    else if(rollResult.total< 7){
      const xpValues = actor.system.xp.value;
        let lastTrueKey = null;
        for (let key in xpValues) {
            if (xpValues[key] === true) {
                lastTrueKey = key;
            }
            else{
              actor.update({[`system.xp.value.${key}`]: true})
              break
            }

        }
    }

  }

  async rollForMove(actor, item, clueID) {
    const is7conditions = actor.system.is7conditions;

    if (!is7conditions) {
      const content = await renderTemplate(
        "systems/SofH/templates/dialogs/rolling-dialog.hbs",
        { item: item, actor: actor, clueID: clueID},
      );

      new moveRoll({
        data:{actor,item,clueID},
        title: game.i18n.localize("sofh.ui.rolling"),
        content,
        buttons: {
          OK: {
            icon: '<i class="fa fa-check"></i>',
            label:`<div class="sofh-button">${game.i18n.localize("sofh.UI.Roll")}</div>`,
            callback: async () => {
              await this.defnieRollingFormula(actor, item);
            },
          }
       
        },
        default: `<div class="sofh-button">${game.i18n.localize("sofh.UI.Roll")}</div>`,
      }).render(true);
    } else {
      ui.notifications.warn(game.i18n.localization("sofh.ui.warrning.cannotactduetoconditions")
        
      );
    }
  }
  async showKnowClue(event){
    const existingClueElements = event.currentTarget.closest('.dialog').querySelectorAll('.single-clue, .complexity');
    existingClueElements.forEach(element => element.remove());
    const target = event.currentTarget.selectedOptions[0].id

    const actorId = this.data.data.actor._id;
    const clueSheet = game.actors.get(target)
    if(clueSheet !== undefined){
  const clueDescription = clueSheet.system.clue;
  const actorClue = clueSheet.system.actorID[actorId];
  let html = "";
  Object.keys(actorClue).forEach(key => {
  if (key.startsWith('have') && actorClue[key] === true) {
    const index = key.slice(4); 
    if (clueDescription.hasOwnProperty(index)) {
      html += ` 
        <div class="single-clue">
          <label class="known-clue-label">${clueDescription[index].description}</label>
          <input type="checkbox" class="circle-checkbox-isapply-clue">
        </div>`
    }
  }
});
if (html !== ""){
  html += `
    <div class="complexity">
      <label class="complexity-label">${game.i18n.localize("sofh.ui.complexity_value")}</label>
      <input type="number" class="complexity-numer"></input>
    </div>
  `

}
const clueSelector = event.currentTarget.closest('.clue-slector'); 
  clueSelector.insertAdjacentHTML('afterend', html); 
    }
  } 

}
