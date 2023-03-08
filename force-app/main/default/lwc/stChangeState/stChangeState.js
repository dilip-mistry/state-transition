import { LightningElement, api } from 'lwc';

export default class StChangeState extends LightningElement {
    @api cardTitle;
    @api objectName;
    @api fieldNames;
    @api changeBtnLabel;
    @api recordId;
}