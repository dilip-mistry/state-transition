import { api, LightningElement } from 'lwc';
import StateModelLib from '@salesforce/resourceUrl/StateModel';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';


export default class StTransitionModel extends LightningElement {

    _validTransition;
    isResourceloaded = false;

    @api
    get validTransition() {
        return this._validTransition;
    }
    set validTransition(value) {
        this._validTransition = value;
        //console.log("new transitions received by graph", JSON.stringify(this._validTransition));
        this.drawGraph();
    }


    renderedCallback() {
        Promise.all([
            loadScript(this, StateModelLib + '/js/graphre.js'),
            loadScript(this, StateModelLib + '/js/nomnoml.js')
        ])
            .then(() => {
                this.isResourceloaded = true;
                this.drawGraph();
            });
    }

    drawGraph() {
        var canvas = this.template.querySelector('canvas');

        if (this._validTransition) {
            var source = this._validTransition
                .filter(item => (item.From_State__c && item.To_State__c))
                .map(function (element) {
                    return `[${element.From_State__c}] -> [${element.To_State__c}]`;
                }).join('\n');

            try {
                nomnoml.draw(canvas, source);
            } catch (err) {
                console.log(err);
            }
        }
    }

}