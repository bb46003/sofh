export class sofhActor extends Actor {
 /** @override */
 async _preCreate(data, options, user) {

    await super._preCreate(data, options, user);
    
    if (this.type === "clue") {
    
      
      await this.updateSource({
          "system.actorID": {},
          "img":"icons/sundries/documents/document-sealed-signatures-red.webp"
      })
    }
    else if(this.type === "character" || this.type === "cule"){
      await this.updateSource({
        "prototypeToken.actorLink": true,
      })
    }
  }
  async _onCreate(data, options, user) {
    await super._onCreate(data, options, user);
    if (this.type === "character") {
        // Find the compendium pack
        const basicMovesPack = game.packs.find(pack => pack.collection === "SofH.moves");
     

        try {
            // Ensure the pack is loaded and then filter for items with type "basicMoves"
            const items = await basicMovesPack.getDocuments();
            const itemsToAdd = items.filter(item => item.type === "basicMoves");

            if (itemsToAdd.length > 0) {
                // Convert all items to plain object format and add flags to each item
                const itemObjects = itemsToAdd.map(item => {
                    const itemObj = item.toObject();
                    let uuid = item.uuid;
                    itemObj.flags = {
                        "compendiumSource": uuid
                    };
                    return itemObj;
                });

                console.log(itemObjects);
                await this.createEmbeddedDocuments("Item", itemObjects);
            } else {
                console.error("No items of type 'basicMoves' found in the compendium pack.");
            }
        } catch (err) {
            console.error("Error loading items from the compendium:", err);
        }
    }
}

    

}