import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class StChangeState extends LightningElement {
    @api cardTitle;
    @api objectName;
    @api fieldNames;
    @api changeBtnLabel;
    @api recordId;

    @track fields = [];

    connectedCallback() {
        this.fields = this.fieldNames.split(",").map(item => item.trim());
    }
    handleSuccess() {
        const event = new ShowToastEvent({
            title: 'Success',
            variant: 'success',
            message:
                'Record has been updated successfully!',
        });
        this.dispatchEvent(event);
    }
}