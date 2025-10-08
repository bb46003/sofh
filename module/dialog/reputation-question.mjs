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
    tag: "form",
    window: {
      contentClasses: ["standard-form"],
    },
  };
  static PARTS = {
    // ...
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };

  async _renderHTML() {
    const data = this.options.system;
    const repTable = {
      gryffindor: [
        "sofh.dialog.reputation.gryfindor1",
        "sofh.dialog.reputation.gryfindor2",
        "sofh.dialog.reputation.gryfindor3",
        "sofh.dialog.reputation.gryfindor4",
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
        "sofh.dialog.reputation.ravenclaw4",
      ],
      slytherin: [
        "sofh.dialog.reputation.slytherin1",
        "sofh.dialog.reputation.slytherin2",
        "sofh.dialog.reputation.slytherin3",
        "sofh.dialog.reputation.slytherin4",
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
    const questions = isOther ? repTable[data.house] : repTable.other;
    const template = "systems/SofH/templates/dialogs/reputation-questions.hbs";
    let html = await sofh_Utility.renderTemplate(template, {
      questions: questions,
      isOther: isOther,
    });
    return html;
  }

  async _replaceHTML(result, html) {
    html.innerHTML = result;
  }
  async _prepareContext() {
    return {
      buttons: [
        { type: "submit", icon: "fa-solid fa-save", label: "SETTINGS.Save" },
      ],
    };
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
    console.log(this);
  }
}
