export class sofhCharacterSheet extends ActorSheet {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["sofh", "sheet", "actor", "character"],
            template: "systems/SofH/templates/character-sheet.hbs",
            width: 800,
            height: 960,
            tabs: [
                {
                    navSelector: ".sheet-tabs",
                    contentSelector: ".sheet-body",
                    initial: "characteristic",
                },
            ],
        });
    }

    async getData() {
        const context = super.getData();
        const actorData = this.actor.toObject(false);
        context.system = actorData.system;
        const { bloodType, favoriteTopic, favoriteTopic2, House, conditionstype, equipment, houseeq } = CONFIG.SOFHCONFIG;
        Object.assign(context, { bloodType, favoriteTopic, favoriteTopic2, House, conditionstype, equipment, houseeq });
       
        async function enrich(html) {
            if (html) {
                return await TextEditor.enrichHTML(html, {
                    secrets: context.actor.isOwner,
                    async: true
                });
            } else {
                return html;
            }
        }

        context.system.equipment = await enrich(context.system.equipment);
        this._prepareMoves(context);
        return context;
    }
    _prepareMoves(context){
        const basicMoves = [];
        const houseMoves = [];
        const peripheralMoves = [];
        const endOfSessionMoves = [];
        const specialPlaybookMoves = [];
        
        for (let item of context.actor.items) {
            switch (item.type) {
                case 'basicMoves':
                    basicMoves.push(item);
                    break;
                case 'houseMoves':
                    houseMoves.push(item);
                    break;
                case 'peripheralMoves':
                    peripheralMoves.push(item);
                    break;
                case 'endOfSessionMoves':
                    endOfSessionMoves.push(item);
                    break;
                case 'specialPlaybookMoves':
                    specialPlaybookMoves.push(item);
                    break;
                default:
                    console.warn(`Unknown item type: ${item.type}`);
                    break;
            }
        }
        
        // After assigning the items to each array, assign these arrays to the context object
        context.basicMoves = basicMoves;
        context.houseMoves = houseMoves;
        context.peripheralMoves = peripheralMoves;
        context.endOfSessionMoves = endOfSessionMoves;
        context.specialPlaybookMoves = specialPlaybookMoves;
        
        
        
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.on("change", ".circle-checkbox-reputation", (ev) => this.handleReputationChange(ev));
        html.on("change", ".circle-checkbox-xp", (ev) => this.handleXpChange(ev));
        html.on("click", ".decrease-btn", () => this.lowerReputationRank());
        html.on("change", ".house", (ev) => this.handleHouseChange(ev));
        html.on("change", ".condition-text, .condition-type", (ev) => this.handleConditionChange(ev));
        html.on("click", ".hover-label-question", () => this.assignHouseQuestions(this.actor.system.home, false));
        html.on("click", (ev) => this.handleDiamondClick(ev));
        html.on("click", "#add-string-btn", (ev) => this.addStringItem(html));
        html.on("click", ".remove-string-btn", (ev) => this.removeStringItem(ev));
        
        html.on("click",".move_type",(ev) => this.showMoves(ev));
        html.on("click",".moves",(ev) => this.collapsAllMoves(ev))
        html.on("click",".remove-moves-btn",(ev => this.removeMoves(ev)));
        html.find(".moves-edit").on("click contextmenu", this.openMoves.bind(this))
        html.find(".roll-moves-btn").on("click", this.rollForMove.bind(this));
        html.find(".moves-description-open").on("click", this.openMovesFromTriggers.bind(this))



    }
 
    async handleReputationChange(ev) {
        const isChecked = $(ev.target).prop("checked");
        const ID = ev.target.id[0];
        await this.updateReputation(ID, isChecked);
    }

    async handleXpChange(ev) {
        const isChecked = $(ev.target).prop("checked");
        const ID = ev.target.id[0];
        await this.updateXp(ID, isChecked);
        if (Number(ID) === 7 && isChecked) {
            const content = await renderTemplate("systems/SofH/templates/dialogs/xp.hbs");
            new Dialog({
                title: game.i18n.localize("sofh.ui.gainxp"),
                content,
                buttons: {
                    OK: {
                        icon: '<i class="fa fa-check"></i>',
                        label: game.i18n.localize("sofh.UI.OK"),
                    },
                },
                default: "OK",
            }).render(true);
        }
    }

    async handleHouseChange(ev) {

        const house = ev.target.value;
        console.log(house)
        if(house !== ""){
        await this.assignGoal(house);
        const changeHouse = true;
        await this.assignHouseQuestions(house,changeHouse);
        await this.addEq(house)
        }
    }

    async handleConditionChange(ev) {
        await this.updateActorCondition(ev, this.actor);
    }

    async handleDiamondClick(ev) {
        const element = ev.target.closest('div');
        if (element && this.isDiamondElement(element)) {
            await this.processDiamondClick(element);
        }
    }

    async isDiamondElement(element) {
        return ["minustwo", "two", "one", "zero", "right-bottom", "right-top", "left-top", "center", "left-bottom"].some(className => element.classList.contains(className));
    }

    async updateReputation(index, value) {
        const actor = this.actor;
        const updateData = {};
        const index2 = Number(index);
        const currentRank = actor.system.reputation.rank;

        if (currentRank !== 5) {
            if (index2 === 7 && value) {
                updateData[`system.reputation.value.${7}`] = true;
                    await actor.update(updateData);
                for (let i = 1; i <= 7; i++) {
                    
                    updateData[`system.reputation.value.${i}`] = false;
                }
                updateData['system.reputation.rank'] = currentRank + 1;
            } else {
                this.updateReputationValues(updateData, index2, value);
            }
            
            await actor.update(updateData);
        }
    }

    async updateReputationValues(updateData, index2, value) {
        for (let i = 1; i <= 7; i++) {
            updateData[`system.reputation.value.${i}`] = value ? i <= index2 : i < index2;
        }
    }

    async updateXp(index, value) {
        const actor = this.actor;
        const updateData = {};
        const index2 = Number(index);

        if (index2 === 7 && value) {
            updateData[`system.xp.value.${7}`] = true;
                    await actor.update(updateData);
            for (let i = 1; i <= 7; i++) {
                
                updateData[`system.xp.value.${i}`] = false;
            }
        } else {
            this.updateXpValues(updateData, index2, value);
         
        }
        await actor.update(updateData);
    }

    async updateXpValues(updateData, index2, value) {
        for (let i = 1; i <= 7; i++) {
            updateData[`system.xp.value.${i}`] = value ? i <= index2 : i < index2;
        }
    }

    async lowerReputationRank() {
        const actor = this.actor;
        const rank = Math.max(actor.system.reputation.rank - 1, 0);
        await actor.update({ "system.reputation.rank": rank });
    }

    async assignGoal(house) {
        const actor = this.actor;
        const goal = game.i18n.localize(`sofh.ui.actor.goal${house}`);
        await actor.update({
            "system.goal": goal,
            "system.home": game.i18n.localize(`sofh.ui.actor.${house}`).toLowerCase(),
        });
    }

    async assignHouseQuestions(house,changeHouse) {
        const content = await renderTemplate("systems/SofH/templates/dialogs/house-question.hbs", { home: house });
        new Dialog({
            title: game.i18n.localize("sofh.ui.house-question"),
            content,
            buttons: {
                OK: {
                    icon: '<i class="fa fa-check"></i>',
                    label: game.i18n.localize("sofh.UI.OK"),
                    callback: (html) => {
                        this.handleHouseQuestionSelection(html); 
                        if(changeHouse){
                            this.spefificHousEq(house)
                        }
                    }
                },
            },
            default: "OK",
        }).render(true);
    }

    async handleHouseQuestionSelection(html) {
        const selectedOption = html.find('input[name="housequestion"]:checked');
        if (selectedOption.length > 0) {
            const selectedLabel = selectedOption.next('label').text().trim();
            await this.actor.update({ "system.housequestion": selectedLabel });
        } 
        else {
            ui.notifications.warn(game.i18n.localize("sofh.ui.warning.noSelection"));
        }
    }

    async spefificHousEq(house){
        const houseEq = CONFIG.SOFHCONFIG.houseeq[house];
        const actor = this.actor;
        const header = game.i18n.localize("sofh.ui.eqquestion");
        let content = `<h2>${header}</h2><form id="equipmentForm">`;
        let i = 0;
        Object.keys(houseEq).forEach(key => {
            const value = houseEq[key];
            const eq = game.i18n.localize(value);

            content += `
                <div>
                    <label>
                        <input type="checkbox" name="equipment${i}" value="${eq}" class="equipment-option">
                        ${eq}
                    </label>
                </div>`;
            i++
        });

        content += '</form>';
        const title = game.i18n.localize("sofh.ui.dialog.houseeq");

        const d = new Dialog({
            title: title,
            content: content,
            buttons: {
                submit: {
                    label: game.i18n.localize("sofh.ui.submit"),
                    callback: async (html) => {
                        const selectedOptions = html.find('input[type="checkbox"]:checked');
                        const selectedValues = [];
                        selectedOptions.each(function() {
                            selectedValues.push($(this).val());
                        });

                        if (selectedValues.length > 3) {
                            ui.notifications.error(game.i18n.localize("sofh.ui.dialog.eqwarrning"));
                        return;
                        }
                        let currentEquipment = actor.system.equipment || "";
                        selectedValues.forEach(value => {
                            currentEquipment += `<br>${value}`;
                        });
                        await actor.update({
                            'system.equipment': currentEquipment
                        });
                        ui.notifications.info(game.i18n.localize("sofh.ui.dialog.addeqconfirmation"));
                    }
                },
                cancel: {
                    label: game.i18n.localize("sofh.ui.cancel")
                }
            },
            default: "submit",
            close: () => {
    
            },
            render: (html) => {
                const radioButtons = html.find('.equipment-option');
                let selectedOptions = [];
                radioButtons.each(function() {
                    $(this).on('change', function(event) {
                        if (event.target.checked) {
                            if (selectedOptions.length >= 3) {
                                event.target.checked = false;
                                ui.notifications.warn("You can only select up to 3 options!");
                            } 
                            else {
                                selectedOptions.push(event.target);
                           
                            }
                        }
                        else {
                            selectedOptions = selectedOptions.filter(item => item !== event.target);
                        }
                    });
                });
            }
        }).render(true);

    }
  
    async processDiamondClick(element) {
        if(element.parentNode.className === "diamond"){
        if (element.dataset.clicked) return;
        element.dataset.clicked = true;

        this.resetDiamondClickState(element);
        element.classList.toggle("clicked");

        const value = Number(element.querySelector('p')?.textContent || "");
        const elementId = Number(element.id);
        const updateData = { [`system.relation.value${elementId}`]: value };

        await this.actor.update(updateData);

        setTimeout(() => {
            delete element.dataset.clicked;
        }, 100);
    }
    }

    async resetDiamondClickState(element) {
        const positionClasses = ['left-bottom ', 'center ', 'right-bottom ', 'left-top ', 'right-top '];
        if (positionClasses.includes(element.className)) {
            Array.from(element.offsetParent.children).forEach(child => {   
                if (child.classList.contains('clicked')) {
                    child.classList.remove('clicked');
                }
            });
        }
    }

    async addEq(house){
        const baseEq = game.i18n.localize(CONFIG.SOFHCONFIG.equipment[house]);
        let formattedStr = baseEq.replace(/, /g, ',<br>');
        const actor=this.actor;
        let updateData={};
        updateData['system.equipment']=formattedStr;
        actor.update(updateData);
    }

    async addStringItem() {
        const actor = this.actor;
        let strings = actor.system.strings || [];
        let i =  Object.keys(strings).length+1;
        const stringElement = 
            {
              "name":"",
              "description":""
            };
        strings[i]=stringElement;
        await actor.update({ 'system.strings': strings });
    }
    
    async removeStringItem(ev) {
        const button = ev.target; 
        const ID = button.id; 
        let strings = this.actor.system.strings; 
        const newStrings = { ...strings }; 
        delete newStrings[ID]; 
        await this.actor.update({ 'system.strings': [{}] });
        await this.actor.update({ 'system.strings': newStrings });
    }
    
    async updateActorCondition(ev, actor) {
        const updateData = { [ev.target.name]: ev.target.value };
        await actor.update(updateData);
        const allConditionsMet = Object.values(actor.system.condition).every(condition => condition.type && condition.text);
        await actor.update({ 'system.is7conditions': allConditionsMet });
    }

    async  openMoves(event) {
        const itemRow = event.target.closest(".sheet-table-data");        
        const itemId = itemRow.getAttribute("data-item-id");
        const move = this.actor.items.get(itemId);
        if (event.type === "contextmenu"){        
            move.sheet.render(true);
        }
        else{
            event.preventDefault(); // Prevent default anchor behavior
            const removeButton = document.querySelector(`.remove-moves-btn[id='${move.id}']`);
            const decription = document.querySelector('.second-row');
            const titleDiv = document.querySelector(`.first-row[id='${move.id}']`);            
            if (decription === null) {
                const newElement = document.createElement('div');
                const moveBody = await renderTemplate("systems/SofH/templates/tab/partial/moves-body-limited.hbs", (move));
                newElement.innerHTML = moveBody;
                titleDiv.insertAdjacentElement('afterend', newElement);
            } else {
                decription.remove(); // Remove the description element
            }
            
    }

           


    }

    async showMoves(event) {
        const moveType = event.target.id;
        const movesElement = $(".all-moves." + moveType); 
        if (movesElement.css("display") === "none") {
            movesElement.css("display", "");
        } else {
            movesElement.css("display", "none");
        }
    
      
    }

    async collapsAllMoves(event) {
        const tatget = event.target.classList.value;
        if(tatget === "moves active"){
          const movesElement = $(".all-moves");
          movesElement.css("display", "none");
        }

    }
    
    async removeMoves(event){
        const button = event.target; 
        const ID = button.id; 
        const item = this.actor.items.get(ID);
        await this.actor.deleteEmbeddedDocuments("Item", [ID]);
        const movesElement = $(".all-moves." + item.type); 
        await movesElement.css("display", "");

        

    }
    async rollForMove(event){
        const button = event.target; 
        let ID = button.id;
        if(ID === ""){
            ID =event.currentTarget.id
        } 
        const item = this.actor.items.get(ID);
        const actor = this.actor;
        const is7conditions=actor.system.is7conditions
        if(!is7conditions){
        const content = await renderTemplate("systems/SofH/templates/dialogs/rolling-dialog.hbs", { item: item, actor:actor });
        new Dialog({
            title: game.i18n.localize("sofh.ui.rolling"),
            content,
            buttons: {
                OK: {
                    icon: '<i class="fa fa-check"></i>',
                    label: game.i18n.localize("sofh.UI.Roll"),
                    callback: async (html) => {
                        await this.defnieRollingFormula(html, actor, item)
                    }
                },
            },
            default: game.i18n.localize("sofh.UI.Roll"),
        }).render(true);
    }
    else{
        ui.notifications.warn(game.i18n.localize(game.i18n.localization("sofh.ui.warrning.cannotactduetoconditions")));
    }

    }
    async defnieRollingFormula(html, actor, item){


        const selections = {
            houseApply: null,
            conditions: [],
            questions: [],
            relevantRelation: null,
            relevantString: null,
            numericModifier: null,
            otherrolltype: 0,
            oponentcondition: 0
        };
        let rollmod = 0;
        let dicenumber = 0;
       
    
  
        const houseCheckbox = document.querySelector('.circle-checkbox-housequestion');
        if(houseCheckbox){
            selections.houseApply = houseCheckbox.checked;
            if (selections.houseApply){
                rollmod = rollmod+1
            }
        }
        const oponentcondition = document.querySelector('.oponent-have-condition-checkbox').checked;
        if(oponentcondition){
            selections.oponentcondition = houseCheckbox.oponentcondition;
            if (selections.oponentcondition){
                dicenumber=dicenumber+1;
            }
        }
 
        const conditionElements = document.querySelectorAll('.conditions-roll-detail');
        conditionElements.forEach(condition => {
            const isApply = condition.querySelector('.circle-checkbox-isapply').checked;
            if (isApply) {
                selections.conditions.push({isApply });
                dicenumber=dicenumber-1;
            }
        });
    

        const questionElements = document.querySelectorAll('.question-sheet-roll');
        questionElements.forEach(question => {
            const impact = question.querySelector('.question-impact').value; 
            const isApply = question.querySelector('.circle-checkbox-isapply').checked;
            if (isApply) {
                selections.questions.push({impact, isApply });
                if(impact && isApply){
                    rollmod = rollmod + 1
                }
                else if(!impact && isApply){
                    rollmod = rollmod - 1
                }
            }
        });
    
        const relationSelect = document.querySelector('.relation-chosen');
        if (relationSelect) {
            selections.relevantRelation = relationSelect.value;
            rollmod = rollmod + Number(relationSelect.value)
        }
    

        const stringsSelect = document.querySelector('.roll-strings');
        if (stringsSelect) {
            selections.relevantString = stringsSelect.value;
            if(stringsSelect.value !== ""){
                dicenumber = dicenumber + 1;          

            }
        }

        const numericInput = document.querySelector('.numeric-mod');
        selections.numericModifier = numericInput ? numericInput.value : null;
        const otherMod = Number(selections.numericModifier);
        rollmod = rollmod + otherMod;
        selections.otherrolltype = document.querySelector('[name="ad-disad"]').value;
        let diceMod = Number(selections.otherrolltype);
        if (diceMod > 3){
            diceMod =3
        }
        else if(diceMod < -3){
            diceMod = -3
        }

        dicenumber = dicenumber + diceMod;
         let formula = "2d6";
        if(rollmod.toString() > 0 ){
             formula = "2d6 + " +rollmod.toString() 
        }
        else if(rollmod.toString() < 0 ){
            formula = "2d6" + rollmod.toString() 
        }
            
        if(dicenumber > 0){
             formula = "3d6kh2" 
             if(rollmod.toString() > 0 ){
                formula = "3d6kh2 +" +rollmod.toString() 
           }
           else if(rollmod.toString() < 0 ){
               formula = "3d6kh2" + rollmod.toString() 
           }
        }
        else if(dicenumber < 0){
            formula = "3d6kl2" + rollmod.toString()
            if(rollmod.toString() > 0 ){
                formula = "3d6kl2 +" +rollmod.toString() 
           }
           else if(rollmod.toString() < 0 ){
               formula = "3d6kl2" + rollmod.toString() 
           }
        }
        await this.rolling(actor,item,formula)
        if(stringsSelect.value !== ""){
            this.removeStrinAfterRoll(stringsSelect.value)
        }
    }  

    async rolling(actor, item, formula){
          const rollResult = await new Roll(formula).evaluate();
        const total = rollResult.total;

       
        const label = item.name;
        let content = "";
        if (total >= 10) {
            content = item.system?.above10 || "No content for above 10.";
        } else if (total >= 7 && total <= 9) {
            content = item.system?.['7to9'] || "No content for 7 to 9.";
        } else {
            content = item.system?.below7 || "No content for below 7.";
        }

      
        content = `
        <h3>Move Name: ${label}</h3><br>
        <h2 class="move_type description-label ">${game.i18n.localize("sofh.item.descriptionlabel")}</h2>  
        <div class="move-description-chat">${item.system.description}</div><br>
        <h2 class="move_type description-label ">${game.i18n.localize("sofh.chat.rollesult")}</h2>  
        <div class="roll-results">${content}</div><br>
    `;
      
        rollResult.toMessage({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: content
        });
    }
    async removeStrinAfterRoll(stringName){

        const strings = this.actor.system.strings;
        for (const key in strings) {
            if (strings[key].name === stringName) {
              delete strings[key];
              break; 
            }
          }
        
        await this.actor.update({ 'system.strings': [{}] });
        await this.actor.update({ 'system.strings': strings });
    }
    async openMovesFromTriggers(event){
        if(event.currentTarget.className === "moves-description-open"){

        const ID = event.currentTarget.id;
        const item = this.actor.items.get(ID);
        const title = item.name;        
        const content = await renderTemplate("systems/SofH/templates/dialogs/moves-body-limited.hbs", { item });
       
        const d= new Dialog({
            title: title,
            content: content,
            buttons: {
                close: {
                    label: game.i18n.localize("sofh.ui.close"),
                    callback: () => {
                    }
                }
            },
            default: "close",
           
        })
        d.render(true,{height:800,width:450});
    }
    }
} 
