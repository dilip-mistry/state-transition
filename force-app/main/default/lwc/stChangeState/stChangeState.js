import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';

export default class StChangeState extends LightningElement {
    @api cardTitle;
    @api fieldNames;
    @api changeBtnLabel;

    @api objectApiName;
    @api recordId;

    @track record;
    @track objectInfo;
    @track fields = []; // to display on the page/html
    @track fieldList = []; // to get the details of the record

    connectedCallback() {
        this.fields = this.fieldNames.split(",").map((item) => {
            return { fieldName: item.trim() };
        });

        this.fieldList = this.fieldNames.split(",").map(item => item.trim());
        this.fieldList = [...this.fieldList, "RecordTypeId"];
        console.log(this.fieldList, "Field List");
    }

    renderedCallback() {
    }

    @wire(getRecord, { recordId: '$recordId', fields: '$fieldList' })
    wiredRecordss({ error, data }) {
        if (data) {
            this.record = data;
            console.log(data, "data");
            console.log(data.Status, "data.Status");
            console.log(getFieldValue(data, 'Case.Status'));
        } else {
            console.log(error, "error");
        }
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