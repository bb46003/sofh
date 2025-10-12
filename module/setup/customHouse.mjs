import sofh_Utility from "../utility.mjs";

export class customHouse extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    width: "auto",
    height: 500,
    template: "systems/SofH/templates/app/custom-config.hbs",
    classes: ["sofh-custom"],
    tabs: {
      sheet: {
        initial: "addhouse",
        tabs: [
          { id: "addhouse", label: "Add House" },
          { id: "addblood", label: "Add Blood Type" },
        ],
      },
    },
    actions: {
      addHouse: customHouse.#addHouse,
      addBloodType: customHouse.#addBloodType,
      addHouseEq: customHouse.#addHouseEq,
      save: customHouse.#saveData,
      addSubject1: customHouse.#addSubject1,
      addSubject2: customHouse.#addSubject2,
      removeHouseEq: customHouse.#removeHouseEq,
      removeBlood: customHouse.#removeBlood,
      removeTopic1: customHouse.#removeTopic1,
      removeTopic2: customHouse.#removeTopic2
    },
  };

  static TABS = {
    sheet: [
      { id: "addhouse", group: "sheet", active: true, cssClass: "active" },
      { id: "addblood", group: "sheet", active: false, cssClass: "" },
    ],
  };

  static PARTS = {
    addhouse: {
      id: "addhouse",
      group: "sheet",
      template: "systems/SofH/templates/app/part/custom-house.hbs",
    },
    addblood: {
      id: "addblood",
      group: "sheet",
      template: "systems/SofH/templates/app/part/custom-blood-type.hbs",
    },
    addsubject: {
      id: "addsubject",
      group: "sheet",
      template: "systems/SofH/templates/app/part/subject.hbs",
    },
  };
  #getTabs() {
    const element = this?.element;
    let activeTab = "";
    if (element !== undefined && element !== null) {
      const tabsElements = element.querySelector(".tab.active");
      if (tabsElements !== null) {
        activeTab = tabsElements.dataset.tab;
      }
    }
    const tabs = {};
    for (const [groupId, config] of Object.entries(this.constructor.TABS)) {
      const group = {};
      for (const t of config) {
        const isGM = game.user.isGM;
        let active = false;

        if (isGM && t.id === "addhouse" && activeTab === "") {
          active = true;
        }
        if (activeTab !== "" && t.id === activeTab) {
          active = true;
        }

        group[t.id] = {
          ...t,
          active,
          cssClass: active ? "active" : "",
        };
      }
      tabs[groupId] = group;
    }
    return tabs;
  }
  async _renderHTML() {
    const data = game.settings.get("SofH", "customConfig") || {};
    let html = await sofh_Utility.renderTemplate(this.options.template, {data:data});
    let partsHtml = "";
    for (const part of Object.values(this.constructor.PARTS)) {
      let templateData = {};

      // Pick the data based on the part id
      switch (part.id) {
        case "addhouse":
          templateData = data?.houses;
          break;
        case "addblood":
          templateData = data?.bloodTypes;
          break;
        case "addsubject":
          templateData = {
            topic1: data?.topic1,
            topic2: data?.topic2,
            replaceTopic: data?.replaceTopic,
          };
          break;
      }
      partsHtml += await sofh_Utility.renderTemplate(part.template, {
        data: templateData,
      });
    }
    html = html.replace(/(<nav class="sheet-tabs[^>]*">[\s\S]*?<\/nav>)/, `$1${partsHtml}`);

    return html;
  }

  async _replaceHTML(result, html) {
    html.innerHTML = result;
  }
  static async #addHouse() {
    const element = this.element;
    const html = await sofh_Utility.renderTemplate("systems/SofH/templates/app/part/tab/new-house.hbs");
    const container = element.querySelector(".custom-houses");
    const lastSection = container.querySelector("section:last-of-type");
    if (lastSection) {
      lastSection.insertAdjacentHTML("afterend", html);
    } else {
      container.insertAdjacentHTML("beforeend", html);
    }
  }
  async _prepareContext(options) {
    return this.#getTabs();
  }
  static async #saveData() {
    const element = this.element;
    if (!element) return;

    const data = {
      houses: [],
      bloodTypes: [],
      topic1: [],
      topic2: [],
      replaceTopic: false,
    };

    // --- Houses ---
    const houseSections = element.querySelectorAll(".custom-house");
    houseSections.forEach((section) => {
      const houseName = section.querySelector('input[name="houseName"]')?.value.trim() || null;
      const equipment = section.querySelector('input[name="equipment"]')?.value.trim() || null;

      const eqInputs = section.querySelectorAll('input[name="houseEq"]');

      const houseEq = Array.from(eqInputs)
        .map((i) => i.value.trim())
        .filter((v) => v !== "");
      const questionInputs = section.querySelectorAll('input[name="houseQuestion"]');
      const questions = Array.from(questionInputs)
        .map((i) => i.value.trim())
        .filter((v) => v !== "");

      const question1 = questions[0] || null;
      const question2 = questions[1] || null;
      const goal = section.querySelector(`input[name="timeToShine"]`)?.value.trim() || null;
      const timeToShine = section.querySelector(`input[name="houseGoal"]`)?.value.trim() || null;
      if (houseName || equipment || houseEq.length > 0) {
        data.houses.push({
          name: houseName,
          equipment: equipment,
          houseEq,
          question1,
          question2,
          goal,
          timeToShine,
        });
      }
    });
    const subject1 = element.querySelectorAll('input[name="subject"]');
    const subject2 = element.querySelectorAll('input[name="subject2"]');

    subject1.forEach((input) => {
      const val = input.value.trim();
      if (val) data.topic1.push(val);
    });
    subject2.forEach((input) => {
      const val = input.value.trim();
      if (val) data.topic2.push(val);
    });

    // --- Blood Types ---
    const bloodInputs = element.querySelectorAll(".custom-blood input[type='text']");
    bloodInputs.forEach((input) => {
      const val = input.value.trim();
      if (val) data.bloodTypes.push(val);
    });

    const topicReplace = element.querySelector(`input[name="replaceTopics"]`).checked;
    data.replaceTopic = topicReplace;
    // --- Save to settings ---
    await game.settings.set("SofH", "customConfig", data);
    ui.notifications.info("Custom config saved");

    // --- Merge into existing SOFHCONFIG ---
    // Blood types
    data.bloodTypes.forEach((blood, i) => {
      const key = `bloodType${i + 1}`;
      CONFIG.SOFHCONFIG.bloodType[key] = blood;
    });

    // Houses
    data.houses.forEach((house) => {
      if (house.name) {
        const key = house.name.toLowerCase().replace(/\s+/g, "_");

        // House name
        CONFIG.SOFHCONFIG.House[key] = house.name;

        // House equipment
        if (!CONFIG.SOFHCONFIG.houseeq[key]) CONFIG.SOFHCONFIG.houseeq[key] = {};
        house.houseEq.forEach((eq) => {
          if (eq) CONFIG.SOFHCONFIG.houseeq[key][eq.toLowerCase().replace(/\s+/g, "_")] = eq;
        });

        // General equipment
        if (house.equipment) CONFIG.SOFHCONFIG.equipment[key] = house.equipment;
        CONFIG.SOFHCONFIG.goal["goal" + key] = house.goal;
        CONFIG.SOFHCONFIG.timeToShine[key + "TimeToShine"] = house.timeToShine;
      }
    });

    if (topicReplace) {
      CONFIG.SOFHCONFIG.favoriteTopic = {};
      CONFIG.SOFHCONFIG.favoriteTopic2 = {};
    }
    data.topic1.forEach((topic, i) => {
      const key = `topic-${i + 1}`;
      CONFIG.SOFHCONFIG.favoriteTopic[key] = topic;
    });
    data.topic2.forEach((topic, i) => {
      const key = `topic-${i + 1}`;
      CONFIG.SOFHCONFIG.favoriteTopic2[key] = topic;
    });
    this.close();
  }

  static async #addBloodType() {
    const element = this.element;
    const html = `        <div class="custom-blood">
          <input type="text" name="bloodType" value="">
          <a><i class="fa fa-trash" data-action="removeBlood"></i></a>
      </div>     `;
    const container = element.querySelectorAll(`.input[name="bloodType"]`);
    const lastSection = container[container.length - 1];
    if (lastSection) {
      lastSection.insertAdjacentHTML("afterend", html);
    } else {
      const bloodContainer = element.querySelector(".custom-house-header.addBlood");
      if (bloodContainer) bloodContainer.insertAdjacentHTML("beforeend", html);
    }
  }
  static async #addSubject2() {
    const element = this.element;
    const html = `     <div class= "custom-topic1">
            <input type="text" name="subject2" value="">
            <a><i class="fa fa-trash"  data-action="removeTopic2"></i></a>
      </div>`;
    const container = element.querySelectorAll(`.input[name="subject2"]`);
    const lastSection = container[container.length - 1];
    if (lastSection) {
      lastSection.insertAdjacentHTML("afterend", html);
    } else {
      const bloodContainer = element.querySelector(".custom-house-header.subject2");
      if (bloodContainer) bloodContainer.insertAdjacentHTML("beforeend", html);
    }
  }
  static async #addSubject1() {
    const element = this.element;
    const html = `      <div class= "custom-topic1">
          <input type="text" name="subject" value="">
          <a><i class="fa fa-trash"  data-action="removeTopic1"></i></a>
      </div>`;
    const container = element.querySelectorAll(`.input[name="subject]`);
    const lastSection = container[container.length - 1];
    if (lastSection) {
      lastSection.insertAdjacentHTML("afterend", html);
    } else {
      const bloodContainer = element.querySelector(".custom-house-header.subject1");
      if (bloodContainer) bloodContainer.insertAdjacentHTML("beforeend", html);
    }
  }

  static async #addHouseEq(event) {
    const target = event.target;
    const element = target.parentElement.parentElement.parentElement;
    const html = '<input type="text" name="houseEq">';
    const eq = element.querySelectorAll(`input[name="houseEq"]`);
    const lastEq = eq[eq.length - 1];
    if (lastEq) {
      lastEq.insertAdjacentHTML("afterend", html);
    } else {
      const addButton = element.querySelector('[data-action="addHouseEq"]');
      if (addButton) addButton.insertAdjacentHTML("afterend", html);
    }
  }

  static #removeHouseEq(event){
    const target = event.target;
    const element = target.parentElement.parentElement.parentElement
    const houseName = element.querySelector('input[name="houseName"]').value;
    if (CONFIG.SOFHCONFIG.House?.[houseName]) {
      delete CONFIG.SOFHCONFIG.House[houseName];
       delete CONFIG.SOFHCONFIG.goal["goal"+houseName]
       delete CONFIG.SOFHCONFIG.timeToShine[houseName+"TimeToShine"];
       delete CONFIG.SOFHCONFIG.houseeq[houseName]

    console.log(`Removed house: ${houseName}`);
  } else {
    console.warn(`House "${houseName}" not found.`);
  }

  // Optional: update UI or re-render
  element.remove();

  }

  static #removeBlood(event){
    const element = event.target.parentElement.parentElement;
    const blood = element.querySelector(`input[type="text"]`).value
    if(blood !== ""){
      delete CONFIG.SOFHCONFIG.bloodType[blood];
      element.remove()
    }
  }
  static #removeTopic1(event){
    const element = event.target.parentElement.parentElement;
    const tipic = element.querySelector(`input[type="text"]`).value
    if(tipic !== ""){
      delete CONFIG.SOFHCONFIG.favoriteTopic[tipic];
      element.remove()
    }
  }
    static #removeTopic2(event){
    const element = event.target.parentElement.parentElement;
    const tipic = element.querySelector(`input[type="text"]`).value
    if(tipic !== ""){
      delete CONFIG.SOFHCONFIG.favoriteTopic2[tipic];
      element.remove()
    }
  }
}
