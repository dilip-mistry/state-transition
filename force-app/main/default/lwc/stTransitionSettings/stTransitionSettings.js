import { LightningElement, track, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getObjects from '@salesforce/apex/ST_TransitionSettingsController.getObjects';
import getFields from '@salesforce/apex/ST_TransitionSettingsController.getObjectFields';
import getPicklistValues from '@salesforce/apex/ST_TransitionSettingsController.getPicklistValues';
import getProfilesName from '@salesforce/apex/ST_TransitionSettingsController.getProfilesName';
import getAllowedTransitions from '@salesforce/apex/ST_TransitionFlowUtility.getAllowedTransitions';
import dmlOnStateTransition from '@salesforce/apex/ST_TransitionSettingsController.dmlOnStateTransition';

export default class StTransitionSettings extends LightningElement {
    @track listObjects;
    @track listObjectFields;
    @track listFieldValues;
    @track listProfilesName;
    @track isLoading = true;
    selectedOptions = [];
    @track error;

    @api selectedObject;
    @api selectedField;

    @track allowedTransitions;

    get showTransitionSection() {
        return this.selectedObject && this.selectedField;
    }

    @wire(getObjects)
    wiredObjectsName({ error, data }) {
        if (data) {
            console.log('@@@ wiredObjectsName');
            this.listObjects = [];//[{ value: '', label: '' }];
            for (var key in data) {
                this.listObjects.push({ label: data[key], value: key }); //Here we are creating the array to show on UI.
            }
            this.listObjects = this.sortDataByValue(this.listObjects);
            this.error = undefined;
        } else if (error) {
            this.error = error;
        }
    }

    sortDataByValue(records) {
        return records.sort((a, b) => (a.label < b.label) ? -1 : ((b.label > a.label) ? 1 : 0))
    }

    handleObjectChange(event) {
        this.selectedObject = event.detail.value;
        this.selectedField = null;
        console.log('this.selectedObject - ', this.selectedObject);

        getFields({ objectName: this.selectedObject })
            .then((result) => {
                if (result) {
                    this.listObjectFields = [];//[{ value: "", label: "" }];
                    for (var key in result) {
                        this.listObjectFields.push({ label: result[key], value: key }); //Here we are creating the array to show on UI.
                    }
                    this.listObjectFields = this.sortDataByValue(this.listObjectFields);
                }
            })
            .catch((error) => {
                this.error = error;
            });
    }

    //show/hide spinner
    handleIsLoading(isLoading) {
        this.isLoading = isLoading;
    }

    handleFieldChange(event) {
        this.selectedField = event.detail.value;
        console.log('this.selectedField - ', this.selectedField);

        getPicklistValues({ objectName: this.selectedObject, fieldName: this.selectedField })
            .then((result) => {
                if (result) {
                    this.listFieldValues = [];//[{ value: "", label: "" }];
                    for (var key in result) {
                        this.listFieldValues.push({ label: result[key], value: key }); //Here we are creating the array to show on UI.
                    }
                    this.listFieldValues = this.sortDataByValue(this.listFieldValues);
                }

                return getAllowedTransitions({ objName: this.selectedObject, fieldName: this.selectedField });
            })
            .then((result) => {
                this.allowedTransitions = result;
            })
            .catch((error) => {
                this.error = error;
            });
    }

    @wire(getProfilesName)
    wiredProfileName({ error, data }) {
        if (data) {
            this.listProfilesName = [];
            for (var key in data) {
                this.listProfilesName.push({ label: data[key], value: key });
            }
            this.listProfilesName = this.sortDataByValue(this.listProfilesName);

            this.listProfilesName.push({ label: "All Profiles Allowed", value: "" });

            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.listProfilesName = undefined;
        }
    }

    handleChange(event) {
        this.selectedOptions = event.detail;
    }

    keyIndex = 0;

    //to add row
    addRow() {
        console.log('addRow');
        ++this.keyIndex;
        let myNewElement = { From_State__c: "", To_State__c: "", Id: this.keyIndex, Allowed_Profiles__c: "" };
        console.log("this.allowedTransitions", JSON.stringify(this.allowedTransitions));
        this.allowedTransitions = [...this.allowedTransitions, myNewElement];
    }

    //update table row values in list
    updateValues(event) {
        var foundelement = this.allowedTransitions.find(ele => ele.Id == event.target.dataset.id);
        if (event.target.name === 'From') {
            foundelement.From_State__c = event.target.value;
        } else if (event.target.name === 'To') {
            foundelement.To_State__c = event.target.value;
        } else if (event.target.name === 'AllowedProfiles') {
            foundelement.Allowed_Profiles__c = event.detail.map((item) => item.label).join(",");
        }
    }

    //handle save and process dml 
    handleSaveAction() {
        this.allowedTransitions.forEach(res => {
            if (!isNaN(res.Id)) {
                res.Id = null;
            }
            if (res.Object__c == undefined) {
                res.Object__c = this.selectedObject;
            }
            if (res.Field__c == undefined) {
                res.Field__c = this.selectedField;
            }
        });
        //var parsedRecords = JSON.parse(JSON.stringify(this.records));
        dmlOnStateTransition({ data: this.allowedTransitions })
            .then(result => {
                this.showToast('Success', result, 'Success', 'dismissable');
            }).catch(error => {
                console.log(error);
                this.showToast('Error updating or refreshing records', error.body.message, 'Error', 'dismissable');
            });
    }

    removeRow(event) {
        console.log('removeRow -- ' + JSON.stringify(this.allowedTransitions));
        this.allowedTransitions.splice(this.allowedTransitions.findIndex(row => row.Id === event.target.dataset.id), 1);
    }

    showToast(title, message, variant, mode) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: mode
        });
        this.dispatchEvent(event);
    }

    reDrawGraph() {
        this.template.querySelector('c-st-transition-model').drawGraph();
    }
}