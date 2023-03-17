import { api, LightningElement } from 'lwc';
import StateModelLib from '@salesforce/resourceUrl/StateModel';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';


export default class StTransitionModel extends LightningElement {
    @api
    validTransition;


    renderedCallback() {
        Promise.all([
            loadScript(this, StateModelLib + '/js/graphre.js'),
            loadScript(this, StateModelLib + '/js/nomnoml.js')
        ])
            .then(() => {
                this.drawGraph();
            });
    }

    @api
    drawGraph() {
        var canvas = this.template.querySelector('canvas');
        console.log("this.validTransition", JSON.stringify(this.validTransition));

        if (this.validTransition?.length) {
            var source = this.validTransition.map(function (element) {
                return `[${element.From_State__c}] -> [${element.To_State__c}]`;
            }).join('\n');

            nomnoml.draw(canvas, source);
        }
    }

}