const { api } = foundry.applications;

export class HomeScore extends api.HandlebarsApplicationMixin(api.Application)  {
  constructor(options = {}) {
    if (HomeScore._instance) {
      throw new Error("Home Score already has an instance!!!");
    }

    super(options);

    HomeScore._instance = this;
    HomeScore.closed = true;

    this.data = {};
  }

  static DEFAULT_OPTIONS = {
      classes: ["SofH", "home-score-tracker"],    
      window:{
      title: "Home Score",    
      popOut: false,
      resizable: true,
      },
     position:{width:"auto", height:"auto"}
      
    };
  static PARTS = {
    main: {
      id: "home-score-app",
      template: "systems/SofH/templates/app/home_score-tracker.hbs",
    }
  }

  _prepareContext() {
    const context = {};
    const SYSTEM_ID = "SofH";
    context.points_slytherin = game.settings.get(
      SYSTEM_ID,
      "points_slytherin",
    );
    context.points_ravenclaw = game.settings.get(
      SYSTEM_ID,
      "points_ravenclaw",
    );
    context.points_hufflepuff = game.settings.get(
      SYSTEM_ID,
      "points_hufflepuff",
    );
    context.points_gryffindor = game.settings.get(
      SYSTEM_ID,
      "points_gryffindor",
    );
    context.slytherin_on_leed = game.settings.get(
      SYSTEM_ID,
      "slytherin_on_leed",
    );
    context.ravenclaw_on_leed = game.settings.get(
      SYSTEM_ID,
      "ravenclaw_on_leed",
    );
    context.hufflepuff_on_leed = game.settings.get(
      SYSTEM_ID,
      "hufflepuff_on_leed",
    );
    context.gryffindor_on_leed = game.settings.get(
      SYSTEM_ID,
      "gryffindor_on_leed",
    );
    

    const userID = game.user.id;
    const right = game.settings.get("SofH", "HomeScorePositionX");
    const bottom = game.settings.get("SofH", "HomeScorePositionY");
    const scale = game.settings.get("SofH", "HomeScoreSize");
    context.class = "house-scores-container-" + userID;
    context.style = `
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        transform-origin: top left;
        transform: scale(var(--scale, 1));
        margin: 5px;
        --scale:${scale}
    `;
    return context;
  }

  static async initialise() {
    if (this._instance) return;
    new HomeScore();
    this.renderHomeScore();
  }



  async render(force = false, options = {}) {
    await super.render(force, options);
   
     const el = this.element;
 this.window.onResize = () => this._onResize(el);
      const userID = game.user.id;
    const buttons = el?.querySelectorAll(".some-box.resolve");
    if(el){
    Array.from(buttons).forEach(button =>{
      button.addEventListener("click", async (ev) =>{   
      const clickedElementId = $(ev.currentTarget).attr("id");
      await HomeScore.resolvePoints(clickedElementId, el);
    });
     
  })

  


}
}
_onResize(entry) {
  
  const userID = game.user.id;
  const container = this.element;
  
  const element = container.querySelector(".house-scores-container-" + userID);
  if (!element) return;
  const width = parseInt(entry.style.width, 10)? parseInt(entry.style.width, 10) : entry.clientWidth
  const newScale =width  / 900;
  element.style.setProperty("--scale", newScale);

  game.settings.set("SofH", "HomeScoreSize", newScale);
}


  static async renderHomeScore() {
    if (HomeScore._instance) {
      HomeScore._instance.render(true);
    }
  
  }

  static async resolvePoints(house, html) {
    if (!game.user.isGM) {
      ui.notifications.warn(
        "Tylko najwyższy Mistrz Gry może zmieniać punkty, ty niegrzeczny uczniu!/niegrzeczna auczennico!",
      );
      return;
    }

    const inputScoreElement = html.find(`.input-score#${house.toLowerCase()}`);
    let inputScore = parseInt(inputScoreElement.val(), 10) || 0;

    let currentPoints = game.settings.get(
      "SofH",
      `points_${house.toLowerCase()}`,
    );
    let newPoints = currentPoints + inputScore;

    await game.settings.set("SofH", `points_${house.toLowerCase()}`, newPoints);
    HomeScore._instance.data[`points_${house.toLowerCase()}`] = newPoints;

    await HomeScore.updatePoints();
  }

  static async updatePoints() {
    const SYSTEM_ID = "SofH";
    const houseSettings = [
      {
        name: "gryffindor",
        value: HomeScore._instance.data.points_gryffindor || 0,
      },
      {
        name: "slytherin",
        value: HomeScore._instance.data.points_slytherin || 0,
      },
      {
        name: "hufflepuff",
        value: HomeScore._instance.data.points_hufflepuff || 0,
      },
      {
        name: "ravenclaw",
        value: HomeScore._instance.data.points_ravenclaw || 0,
      },
    ];

    const houseWithHighestPoints = houseSettings.reduce(
      (maxHouse, currentHouse) => {
        return currentHouse.value > maxHouse.value ? currentHouse : maxHouse;
      },
      houseSettings[0],
    );

    for (let house of houseSettings) {
      let onLeed = house.name === houseWithHighestPoints.name;
      HomeScore._instance.data[`${house.name}_on_leed`] = onLeed;
      await game.settings.set(SYSTEM_ID, `${house.name}_on_leed`, onLeed);
    }
    await game.system.socketHandler.emit({ operation: "updatePoints" });

    HomeScore.renderHomeScore();

    return;
  }

  static async registerSocketEvents() {
    game.socket.on("system.SofH", (ev) => {
      if (ev.operation === "updatePoints") {
        HomeScore.renderHomeScore();
      } else if (ev.operation === "updateXPfromCule") {
        if (game.user.isGM) {
          for (let actorKey in ev.clue.system.actorID) {
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
        }
      }
    });
  }
    async close(options = {}) {
    if (options.closeKey) {
      return false;
    }
    return super.close(options);
  }
 autoscale(element, designWidth = 900, designHeight = 600) {
    const parent = element.parentElement;

    const availableWidth = parent.clientWidth;
    const availableHeight = parent.clientHeight;

    const scaleX = availableWidth / designWidth;
    const scaleY = availableHeight / designHeight;

    const scale = Math.min(scaleX, scaleY);

    element.style.setProperty("--scale", scale);
}
}
