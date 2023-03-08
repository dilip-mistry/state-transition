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
                console.log("script loaded successfully");
                var canvas = this.template.querySelector('canvas');
                console.log("canvas elem", canvas);

                var source = this.validTransition.map(function (element) {
                    return `[${element.from}] -> [${element.to}]`;
                }).join('\n');;

                nomnoml.draw(canvas, source);
            });
    }

}