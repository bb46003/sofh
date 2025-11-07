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
    await this.update({[element]:target.value})
  }
}

async removeRelatedMove(moveID){
  const item = this;
  const relatedMoves = item.system.relatedMoves;
  delete relatedMoves[moveID];
  const reindexed = {};
  Object.values(relatedMoves).forEach((value, index) => {
    reindexed[index] = value;
  });
  await item.update({["system.relatedMoves"]: reindexed });
  item.sheet.render()
}
}
