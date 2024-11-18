export class sofhMovesSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sofh", "sheet", "item"],
      template: "systems/SofH/templates/moves.hbs",
      width: 800,
      height: 800,
    });
  }

  async getData() {
    const context = super.getData();
    const itemData = this.item.toObject(false);
    context.system = itemData.system;
    const { House } = CONFIG.SOFHCONFIG;
    Object.assign(context, { House });
    async function enrich(html) {
      if (html) {
        return await TextEditor.enrichHTML(html, {
          secrets: context.isOwner,
          async: true,
        });
      } else {
        return html;
      }
    }

    context.system.description = await enrich(context.system.description);
    context.system.triggers = await enrich(context.system.triggers);
    context.system.relatedmoves = await enrich(context.system.relatedmoves);
    return context;
  }
  activateListeners(html) {
    super.activateListeners(html);
    html.on("click", "#add-question-btn", (ev) => this.addquestion(html));
    html.on("click", ".remove-question-btn", (ev) => this.removequestion(ev));
    html.on("change", ".relatedmoves", (ev) => this.relatedmoves(ev));
    html.on("change", ".relatedmoves", (ev) => this.rollingguestions(ev));
    html.on("click", ".isrolled", (ev) => this.changeRollingoption(ev));
    html.on('drop', async (event) => {
      event.preventDefault();
      event.stopPropagation();

      // Get the data from the drop event
      const data = JSON.parse(event.originalEvent.dataTransfer.getData('text/plain'));

      const targetItem = this.item;
      if (data.type === "Item" && targetItem.system.realtedtoothermoves === true) {
        const droppedItem = await fromUuid(data.uuid);
        if (droppedItem) {
          const droppedItemUuid = droppedItem.uuid;

          // Logic to handle the target item (the current item sheet's item)
         
          const linkToDroppedItem = `@UUID[${droppedItemUuid}]{${droppedItem.name}}`;
       
          let updateData = {};
          updateData["system.relatedmoves"] = linkToDroppedItem;
          targetItem.update(updateData);


          console.log(linkToDroppedItem);
        } 
      }
    });
  }


  async addquestion() {
    const item = this.item;
    let question = item.system.question || [];
    let i = Object.keys(question).length;
    const questionElement = {
      impact: "false",
      description: ""
    };
    question[i] = questionElement;
    await item.update({ "system.question": question });
  }
  async removequestion(ev) {
    const button = ev.target;
    const ID = button.id;
    let question = this.item.system.question;
    let newQuestion;
    newQuestion = { ...question };
    delete newQuestion[ID];

    const numberOfQuestion = Object.values(newQuestion).length;
    if (numberOfQuestion === 0) {
      await this.item.update({ "system.question": [] });
    } else {
      await this.item.update({ "system.question": [] });
      await this.item.update({ "system.question": newQuestion });
    }
  }
  async relatedmoves(ev) {
    const updateData = { [ev.target.name]: ev.target.value };
    this.item.update(updateData);
  }

  async rollingguestions(ev) {
    const updateData = { [ev.target.name]: ev.target.value };
    this.item.update(updateData);
  }
  async changeRollingoption(ev) {
    if (!ev.target.checked) {
      const updateData = {
        ["system.housequestion"]: false,
        ["system.relationrelated"]: false,
        ["system.stringsrelated"]: false,
        ["system.havequestion"]: false,
        ["system.realtedtoothermoves"]: false,
      };
      this.item.update(updateData);
    }
  }
 
}