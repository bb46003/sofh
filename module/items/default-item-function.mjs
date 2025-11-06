export default class MOVES extends foundry.documents.Item {
  /* -------------------------------------------- */
  /*  Item Attributes                             */
  /* -------------------------------------------- */
  constructor(...args) {
    super(...args);
  }  

async zmianaDanych(event,name,index, name2, element){
   const newValue = event.target.value;
  switch(element){
    case "name":
        await this.update({['name']:newValue})
    break
  }
   this.sheet.render(true)
}
}
