import { HomeScore } from "../app/home_score.mjs";
import { EndSessionRelation } from "../dialog/end-session-moves-relation.mjs";

export default class SocketHandler {
  constructor() {
    this.identifier = "system.SofH";
    this.registerSocketEvents();
  }
  registerSocketEvents() {
    game.socket.on(this.identifier, async (data) => {
      const operation = data.operation;
      switch (operation) {
        case "updatePoints":
          HomeScore.renderHomeScore();
          break;
        case "updateXPfromCule":
          if (game.user.isGM) {
            for (let actorKey in data.clue.system.actorID) {
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
          break;
        case "endOfSesionPlayer":
          const playerToShow = data.player;
          const currentPlayer = game.user._id;
          if (playerToShow === currentPlayer) {
            new EndSessionRelation(data).render(true);
          }
          break;
      }
    });
  }
  emit(data) {
    return game.socket.emit(this.identifier, data);
  }
}
