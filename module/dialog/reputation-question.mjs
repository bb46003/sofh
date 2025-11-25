import sofh_Utility from "../utility.mjs";

export class ReputationQuestion extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    actions: {
      questionChecked: ReputationQuestion.#questionChecked,
      submit: ReputationQuestion.#submit,
    },
    position: {
      width: 640,
      height: "auto",
    },
  };

  async _renderHTML() {
    const data = this.options.system;
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
      other: [
        "sofh.dialog.reputation.default1",
        "sofh.dialog.reputation.default2",
      ],
    };
    const isOther = [
      "gryffindor",
      "hufflepuff",
      "ravenclaw",
      "slytherin",
    ].includes(data.house);
    const reputationQuestion = [
      data?.reputationQuestion1,
      data?.reputationQuestion2,
    ];
    const questions = isOther ? repTable[data.house] : repTable.other;
    const template = "systems/SofH/templates/dialogs/reputation-questions.hbs";
    let html = await sofh_Utility.renderTemplate(template, {
      questions: questions,
      isOther: isOther,
      reputationQuestion: reputationQuestion,
    });

    return html;
  }

  async _replaceHTML(result, html) {
    html.innerHTML = result;
  }
  async _onRender() {
    const element = this.element;

    const button = element.querySelector(
      '.footer button[data-action="submit"]',
    );

    let inputs = element.querySelectorAll('input[type="checkbox"]');
    if (inputs.length === 0) {
      inputs = element.querySelectorAll('input[type="text"]');
    }
    const checkInputs = () => {
      let activeCount = 0;

      inputs.forEach((input) => {
        if (input.type === "checkbox" && input.checked) {
          activeCount++;
        }
        if (input.type === "text" && input.value.trim() !== "") {
          activeCount++;
        }
      });
      button.disabled = activeCount < 2;
    };
    inputs.forEach((input) => {
      input.addEventListener("change", checkInputs);
      input.addEventListener("input", checkInputs);
    });
    checkInputs();
  }

  static #questionChecked(ev) {
    // select all checkboxes inside the element
    const checkboxes = this.element.querySelectorAll('input[type="checkbox"]');

    // count how many are checked
    const checkedCount = Array.from(checkboxes).filter(
      (cb) => cb.checked,
    ).length;

    // if two or more are checked, disable all unchecked checkboxes
    if (checkedCount >= 2) {
      checkboxes.forEach((cb) => {
        if (!cb.checked) cb.disabled = true;
      });
    } else {
      // if fewer than two are checked, enable all checkboxes
      checkboxes.forEach((cb) => (cb.disabled = false));
    }
  }
  static #submit() {
    const checkedBoxes = this.element.querySelectorAll(
      'input[type="checkbox"]:checked',
    );
    const isOther = [
      "gryffindor",
      "hufflepuff",
      "ravenclaw",
      "slytherin",
    ].includes(this.options.system.house);
    let updateData = {};
    if (isOther) {
      updateData["system.reputationQuestion1"] = checkedBoxes[0].id;
      updateData["system.reputationQuestion2"] = checkedBoxes[1].id;
    } else {
      const questionInput = this.element.querySelectorAll('input[type="text"]');
      updateData["system.reputationQuestion1"] = questionInput[0].value;
      updateData["system.reputationQuestion2"] = questionInput[1].value;
    }
    updateData["system.changedYear"] = false;
    const actor = this.options.prototypeToken.actor;
    actor.update(updateData);
    this.close();
  }
}
