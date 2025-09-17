import sofh_Utility from "../utility.mjs";

export class customHouse extends foundry.applications.api.ApplicationV2 {
    static DEFAULT_OPTIONS = {
        width: "auto",
        height: 500,
        template: "systems/SofH/templates/app/custom-config.hbs",
        actions :{
            addHouse: customHouse.#addHouse,
            addBloodType: customHouse.#addBloodType,
            addHouseEq: customHouse.#addHouseEq,
            save: customHouse.#saveData,
        },
        classes:["sofh-custom"]
    }

    async _renderHTML() {
        try {
            const data = game.settings.get("SofH", "customConfig")
            const html = await sofh_Utility.renderTemplate(
                this.options.template, data
            );
            return html;
        } catch (e) {
            console.error("_renderHTML error:", e);
            throw e;
        }
    }

    async _replaceHTML(result, html) {
        html.innerHTML = result;
    }

    static async #addHouse(){
        const element = this.element;
        const html = await sofh_Utility.renderTemplate("systems/SofH/templates/app/part/custom-house.hbs");
        const container = element.querySelector(".custom-houses");
        const lastSection = container.querySelector("section:last-of-type");
        if (lastSection) {
            lastSection.insertAdjacentHTML("afterend", html);
        } else {
            container.insertAdjacentHTML("beforeend", html);
        }
    } 

static async #saveData() {
  const element = this.element;
  if (!element) return;

  const data = {
    houses: [],
    bloodTypes: []
  };

  // --- Houses ---
  const houseSections = element.querySelectorAll(".custom-houses > section");
  houseSections.forEach(section => {
    
    const houseName = section.querySelector('input[name="houseName"]')?.value.trim() || null;
    const equipment = section.querySelector('input[name="equipment"]')?.value.trim() || null;

    const eqInputs = section.querySelectorAll('input[name="houseEq"]');
    const houseEq = Array.from(eqInputs)
      .map(i => i.value.trim())
      .filter(v => v !== "");
    const questionInputs = section.querySelectorAll('input[name="houseQuestion"]');
    const questions = Array.from(questionInputs)
        .map(i => i.value.trim())
        .filter(v => v !== "");

    const question1 = questions[0] || null;
    const question2 = questions[1] || null;

    if (houseName || equipment || houseEq.length > 0) {
      data.houses.push({
        name: houseName,
        equipment: equipment,
        houseEq,
        question1,
        question2
      });
    }
  });

  // --- Blood Types ---
  const bloodInputs = element.querySelectorAll(".custom-blood input[type='text']");
  bloodInputs.forEach(input => {
    const val = input.value.trim();
    if (val) data.bloodTypes.push(val);
  });

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
  data.houses.forEach(house => {
    if (house.name) {
      const key = house.name.toLowerCase().replace(/\s+/g, "_");

      // House name
      CONFIG.SOFHCONFIG.House[key] = house.name;

      // House equipment
      if (!CONFIG.SOFHCONFIG.houseeq[key]) CONFIG.SOFHCONFIG.houseeq[key] = {};
      house.houseEq.forEach(eq => {
        if (eq) CONFIG.SOFHCONFIG.houseeq[key][eq.toLowerCase().replace(/\s+/g, "_")] = eq;
      });

      // General equipment
      if (house.equipment) CONFIG.SOFHCONFIG.equipment[key] = house.equipment;
    }
  });
  this.close()
}



    static async #addBloodType(){
        const element = this.element;
        const html = `<input type="text" name="bloodType" value=""></input>`
        const container = element.querySelectorAll(`.input[name="bloodType"]`);
        const lastSection = container[container.length - 1];
        if (lastSection) {
            lastSection.insertAdjacentHTML("afterend", html);
        } else {
            const bloodContainer = element.querySelector(".custom-blood");
            if (bloodContainer) bloodContainer.insertAdjacentHTML("beforeend", html);
        }
    }

    static async #addHouseEq(){
        const element = this.element;
        const html = '<input type="text" name="houseEq">';
        const eq = element.querySelectorAll(`input[name="houseEq"]`)
        const lastEq = eq[eq.length - 1];
        if (lastEq) {
            lastEq.insertAdjacentHTML("afterend", html);
        } else {
              const addButton = element.querySelector('[data-action="addHouseEq"]');
            if (addButton) addButton.insertAdjacentHTML("afterend", html);
        }
    }
}