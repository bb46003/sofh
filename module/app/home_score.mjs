export class HomeScore extends Application {
  constructor(options = {}) {
    if (HomeScore._instance) {
      throw new Error("Home Score already has an instance!!!");
    }

    super(options);

    HomeScore._instance = this;
    HomeScore.closed = true;

    this.data = {};
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["SofH", "home-score-tracker"],
      height: "200",
      id: "home-score-app",
      popOut: false,
      resizable: false,
      template: "systems/SofH/templates/app/home_score-tracker.hbs",
      title: "Home Score",
      width: "auto",
    });
  }

  getData() {
    super.getData();
    const SYSTEM_ID = "SofH";
    this.data.points_slytherin = game.settings.get(
      SYSTEM_ID,
      "points_slytherin",
    );
    this.data.points_ravenclaw = game.settings.get(
      SYSTEM_ID,
      "points_ravenclaw",
    );
    this.data.points_hufflepuff = game.settings.get(
      SYSTEM_ID,
      "points_hufflepuff",
    );
    this.data.points_gryffindor = game.settings.get(
      SYSTEM_ID,
      "points_gryffindor",
    );
    this.data.slytherin_on_leed = game.settings.get(
      SYSTEM_ID,
      "slytherin_on_leed",
    );
    this.data.ravenclaw_on_leed = game.settings.get(
      SYSTEM_ID,
      "ravenclaw_on_leed",
    );
    this.data.hufflepuff_on_leed = game.settings.get(
      SYSTEM_ID,
      "hufflepuff_on_leed",
    );
    this.data.gryffindor_on_leed = game.settings.get(
      SYSTEM_ID,
      "gryffindor_on_leed",
    );
    return this.data;
  }

  static async initialise() {
    if (this._instance) return;
    new HomeScore();
    this.renderHomeScore();
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".some-box.resolve").click(async (ev) => {
      const clickedElementId = $(ev.currentTarget).attr("id");
      await HomeScore.resolvePoints(clickedElementId, html);
    });
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
}
