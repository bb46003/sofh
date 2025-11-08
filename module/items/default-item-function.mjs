export default class MOVES extends foundry.documents.Item {
  /* -------------------------------------------- */
  /*  Item Attributes                             */
  /* -------------------------------------------- */
  constructor(...args) {
    super(...args);
  }  

async zmianaDanych(event,name,index, name2, element){
  const target = event.target
   const newValue = target.value;   
  switch(element){
    case "name":
        await this.update({['name']:newValue})
    break
  }
  if(element.includes("system.action")){
    await this.update({[element]:target.checked})
  }
  if(target.id === "related-move"){
    await this.update({[name]:target.value})
  }
}

async removeRelatedMove(moveID) {
  const item = this;
  const relatedMoves = item.system.relatedMoves || [];

  // Filter out the move with the given ID
  const updatedMoves = relatedMoves.filter(m => m.moves !== moveID);

  await item.update({
    'system.relatedMoves': updatedMoves
  });

  item.sheet.render(true);
}
async addRelatedMove(){
  const item = this;
  const relatedMoves = item.system.relatedMoves;
  const newMove = {moves :""};
  await item.update({'system.relatedMoves':[...relatedMoves, newMove]})
  item.sheet.render(true)
}

}

