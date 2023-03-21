import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import getAllowedTransitions from '@salesforce/apex/ST_TransitionFlowUtility.getAllowedTransitionsFrom';
import { updateRecord } from "lightning/uiRecordApi";

export default class StChangeState extends LightningElement {
    @api cardTitle;
    @api fieldApiName;
    @api changeBtnLabel;

    @api recordId;
    @api objectApiName;

    @track selectedState;
    @track currentState;
    @track allowedToStates;

    recordTypeId = "012000000000000AAA";
    fetchRecTypeField = false;
    currentRecord;

    picklistGetterObject;
    allPicklistOptions;

    objectInfo;
    fieldInfo;

    get fieldLabel() {
        return this.fieldInfo?.label;
    }


    get fieldsToFetch() {
        var fields = [];
        fields.push(this.objectApiName + "." + this.fieldApiName);
        if (this.fetchRecTypeField == true) {
            fields.push(this.objectApiName + ".RecordTypeId");
        }
        return fields;
    }

    @wire(getRecord, { recordId: '$recordId', fields: '$fieldsToFetch' })
    wiredCurrentRecord({ error, data }) {
        if (data) {
            console.log(data);
            this.currentState = data.fields[this.fieldApiName]?.value;
            if (this.fetchRecTypeField == true) {
                this.recordTypeId = data.fields["RecordTypeId"]?.value;
            }
        }
    }

    @wire(getObjectInfo, { objectApiName: "$objectApiName" })
    wiredObjectInfo({ error, data }) {
        if (data) {
            this.objectInfo = data;

            if (this.objectInfo.fields[this.fieldApiName] !== undefined) {
                this.fieldInfo = this.objectInfo.fields[this.fieldApiName];

                console.log(JSON.stringify(this.fieldInfo));
            }

            if (this.objectInfo.fields["RecordTypeId"] !== undefined) {
                this.fetchRecTypeField = true;
            }
            this.getFieldDetails();
        }
        else {
            console.log("getObjectInfo error", error);
        }
    }

    @wire(getPicklistValues, { recordTypeId: '$recordTypeId', fieldApiName: '$picklistGetterObject' })
    wiredGetPicklistValues({ error, data }) {
        if (data) {
            this.allPicklistOptions = data;
            //this.prepareAllowedTransitions();
        }
        else {
            console.log("getPicklistValues error", error);
        }
    }

    @wire(getAllowedTransitions, { objName: '$objectApiName', fieldName: '$fieldApiName', fromState: '$currentState' })
    wiredAllowedTransitions({ error, data }) {
        if (data) {
            this.allowedToStates = (this.allPicklistOptions?.values).filter(state => data.includes(state.value));
        }
        else {
            console.log("getAllowedTransitions error", error);
        }
    }

    getFieldDetails() {
        switch (this.fieldInfo?.dataType) {
            case 'Picklist':
                this.picklistGetterObject = {
                    objectApiName: this.objectApiName,
                    fieldApiName: this.fieldApiName
                };
                break;
        }
    }

    handleStateChange(event) {
        this.selectedState = event.detail.value;
    }

    updateRecord(event) {
        console.log("update clicked with new value:" + this.selectedState);

        if (this.selectedState) {
            const fields = {};
            fields["Id"] = this.recordId;
            fields[this.fieldApiName] = this.selectedState;

            updateRecord({ fields: fields })
                .then((record) => {
                    console.log(record);
                    this.currentState = this.selectedState;
                    this.selectedState = null;

                    this.handleSuccess();
                })
                .catch((error) => {
                    console.log("updateRecord error", error);
                });
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