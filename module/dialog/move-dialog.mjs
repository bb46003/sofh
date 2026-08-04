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
    tag: "div",
    window: {
      title: "Rolling",
      resizable: true,
    },
    position: { zIndex: 1000 },
    actions: {
      toggleOther: moveRoll.#collapsOtherFactor,
      singleCheck: moveRoll.#allowOnlyOneAproach,
      mysteryChange: moveRoll.#showKnowClue,
      solutionChange: moveRoll.#assignComplexity,
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
    
    return context;
  }
  static async #rollForMove(event, context) {
    event.preventDefault();
    const actor = context.actor;
    const item = context.item;
    const clueID = context.clueID;
  }

  static async #collapsOtherFactor(event, context) {
    const windowApp = event.target.offsetParent;
    const movesElement = windowApp.querySelector(".other-factor");
    const displyNone = movesElement.style.display === "none";
    movesElement.style.display = displyNone ? "" : "none";
  }

  static async #allowOnlyOneAproach(event, context) {}

  static async #showKnowClue(event, context) {}

  static async #assignComplexity(event, context) {}

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
  // 1. Get app root
  const app = event.target.offsetParent  // 2. Get selected option
  const selectedOption = event.target.selectedOptions[0];

  if (!selectedOption) return;

  const complexity = selectedOption.dataset.complexity;

  // 3. Find input
  const input = app.querySelector(".complexity-numer");

  if (!input) {
    console.warn("Complexity input not found");
    return;
  }

  // 4. Set value (fallback to 0)
  input.value = complexity ?? 0;
}
}
