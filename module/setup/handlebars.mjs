export  function registerHandlebarsHelpers() {
    Handlebars.registerHelper({
        eq: (v1, v2) => v1 === v2,
        ne: (v1, v2) => v1 !== v2,
        lt: (v1, v2) => v1 < v2,
        gt: (v1, v2) => v1 > v2,
        lte: (v1, v2) => v1 <= v2,
        gte: (v1, v2) => v1 >= v2,
        and() {
            return Array.prototype.every.call(arguments, Boolean);
        },
        or() {
            return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
        },
    });
    Handlebars.registerHelper('ifCondition',function(condition) {
        const conditionArray = Object.values(condition);
        const anycondition = conditionArray.some(element => element.type !== "" && element.name !== "");
        return anycondition;
    });
    Handlebars.registerHelper('trigerlist', function(actor) {
        // Ensure the actor and items exist
        if (!actor || !actor.items) return '';
    
        const items = actor.items;
        if (items.size !== 0){
        const itemsArray = items._source;
        let htmlOutput = '';
    
        // Iterate through each item
        itemsArray.forEach(item => {
            const triggers = item.system.triggers; // Assuming system.triggers is available
    
            // Check if triggers exist and are not empty
            if (triggers && triggers.length > 0) {
                if (item.system.isrolled){
                htmlOutput += `<a class="roll-moves-btn" id="${item._id}">${triggers}</a>`;
                }
                else{
                    htmlOutput += `<a class="moves-description-open" id="${item._id}">${triggers}</a>`;
                }
            }
        });
    
        return htmlOutput; // Return safe HTML string
    }
    });
    Handlebars.registerHelper('checkIfOnLead', async function (leadVar, options) {
        return leadVar ? '' : 'display:none';
      });
    

    }