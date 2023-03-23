import { LightningElement, track, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getObjects from '@salesforce/apex/ST_TransitionSettingsController.getObjects';
import getFields from '@salesforce/apex/ST_TransitionSettingsController.getObjectFields';
import getPicklistValues from '@salesforce/apex/ST_TransitionSettingsController.getPicklistValues';
import getProfilesNames from '@salesforce/apex/ST_TransitionSettingsController.getProfilesNames';
import getAllowedTransitions from '@salesforce/apex/ST_TransitionFlowUtility.getAllowedTransitions';
import saveAllowedTransitions from '@salesforce/apex/ST_TransitionSettingsController.saveAllowedTransitions';
import { refreshApex } from '@salesforce/apex';

export default class StTransitionSettings extends LightningElement {
    @track error;
    @track listObjects;
    @track listObjectFields;
    @track listFieldValues;
    @track isLoading = true;
    @api selectedObject;
    @api selectedField;

    @track wiredAllowedTransitions;
    @track allowedTransitions = [];

    keyIndex = 0;
    profileDropDownOptions;
    delStateTransitionIds = [];
    selectedProfiles;

    @wire(getObjects)
    wiredObjectsName({ error, data }) {
        if (data) {
            this.listObjects = [];
            for (var key in data) {
                this.listObjects.push({ label: data[key], value: key });
            }
            this.listObjects = this.sortDataByValue(this.listObjects);
            this.error = undefined;
        } else if (error) {
            this.error = error;
        }
    }

    @wire(getProfilesNames)
    wireProfiles({ error, data }) {
        if (data) {
            this.profileDropDownOptions = data.map((profName) => ({ "label": profName, "value": profName }));
        }
    }

    @wire(getAllowedTransitions, { objName: '$selectedObject', fieldName: '$selectedField' })
    wiredGetAllowedTransitions(value) {
        // Hold on to the provisioned value so we can refresh it later.
        this.wiredAllowedTransitions = value; // track the provisioned value

        const { data, error } = value; // destructure the provisioned value
        if (data) {
            console.log("getAllowedTransitions result: ", data);
            this.allowedTransitions = (Array.isArray(data) ? [...data] : []);
        }
        else if (error) {
            console.log("wiredTransitions error", error);
            this.allowedTransitions = [];
        }
    }

    sortDataByValue(records) {
        return records.sort((a, b) => (a.label < b.label) ? -1 : ((b.label > a.label) ? 1 : 0))
    }

    handleObjectChange(event) {
        this.selectedObject = event.detail.value;
        this.selectedField = null;
        //console.log('this.selectedObject - ', this.selectedObject);

        getFields({ objectName: this.selectedObject })
            .then((result) => {
                if (result) {
                    this.listObjectFields = [];
                    for (var key in result) {
                        this.listObjectFields.push({ label: result[key], value: key });
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
        this.allowedTransitions = [];

        getPicklistValues({ objectName: this.selectedObject, fieldName: this.selectedField })
            .then((result) => {
                if (result) {
                    this.listFieldValues = [];
                    for (var key in result) {
                        this.listFieldValues.push({ label: result[key], value: key });
                    }
                    this.listFieldValues = this.sortDataByValue(this.listFieldValues);
                }

                // call refreshApex
                refreshApex(this.wiredAllowedTransitions);
            })
            .catch((error) => {
                this.error = error;
            });
    }

    //to add row
    addRow() {
        var newTransition = { From_State__c: "", To_State__c: "", Id: (++this.keyIndex), Allowed_Profiles__c: "", Object__c: this.selectedObject, Field__c: this.selectedField };
        this.allowedTransitions = [...(Array.isArray(this.allowedTransitions) ? this.allowedTransitions : []), newTransition];
    }

    //update table row values in list
    updateValues(event) {
        if (event.target.dataset.id) {
            this.allowedTransitions = this.allowedTransitions.map(item => {
                var newItem = { ...item };
                if (newItem.Id == event.target.dataset.id) {
                    if (event.target.name === 'From_State__c') {
                        newItem.From_State__c = event.target.value;
                    } else if (event.target.name === 'To_State__c') {
                        newItem.To_State__c = event.target.value;
                    }
                }
                return newItem;
            });
        }
    }

    get hasSameFromToValue() {
        return this.allowedTransitions.some((item) => {
            return item.From_State__c === item.To_State__c;
        });
    }

    get hasDuplicateTransition() {
        const set = new Set();
        var duplicateFlag = false;
        //add unique property values to Set and compare the size changes to detect duplicate property values.
        if (this.allowedTransitions.some((transition) => set.size === (set.add(`${transition.From_State__c}-${transition.To_State__c}`), set.size))) {
            duplicateFlag = true;
        }

        return duplicateFlag;
    }

    //Upsert/Delete State Transisition
    handleSaveAction() {
        if (this.hasSameFromToValue) {
            this.showToast('Invalid Transition', 'Transition From and To State cannot be the same.', 'Error', 'dismissable');
        }
        else if (this.hasDuplicateTransition) {
            this.showToast('Duplicate Transition', 'Duplicate Transition record identitied with the same From  & To States.', 'Error', 'dismissable');
        }
        else {
            this.allowedTransitions.forEach(res => {
                if (!isNaN(res.Id)) {
                    res.Id = null;
                }
            });

            console.log("handleSaveAction:",
                JSON.stringify(this.allowedTransitions),
                JSON.stringify(this.delStateTransitionIds));

            saveAllowedTransitions({ recordsToUpsert: this.allowedTransitions, recordsToDelete: this.delStateTransitionIds })
                .then(result => {
                    this.showToast('Success', result, 'Success', 'dismissable');
                    this.delStateTransitionIds = [];

                    // call refreshApex
                    refreshApex(this.wiredAllowedTransitions);
                })
                .catch(error => {
                    console.log(error);
                    this.showToast('Error updating or refreshing records', error.body.message, 'Error', 'dismissable');
                });
        }
    }

    handleProfileSelection(event) {
        this.selectedProfiles = event.detail.value;
    }

    handleApplyProfiles() {

        var selectedTransitions = [...this.template.querySelectorAll('lightning-input')]
            .filter(element => element.checked)
            .map(element => element.dataset.id);

        /*
        console.log("handleApplyProfiles:",
            JSON.stringify(this.selectedProfiles),
            JSON.stringify(selectedTransitions),
            JSON.stringify(this.allowedTransitions)); */

        this.allowedTransitions = this.allowedTransitions.map(item => {
            return selectedTransitions.includes(`${item.Id}`) ? { ...item, "Allowed_Profiles__c": this.selectedProfiles?.join(", ") } : item;
        });
    }

    //To Remove Row
    removeRow(event) {
        //console.log('remove rows - ', event.target.dataset.id);
        const rowId = event.target.dataset?.id;

        // add the row for deletion
        if (isNaN(rowId) && rowId.length == 18) {
            this.delStateTransitionIds.push(rowId);
        }

        // remove the deleted transition from the allowedTransition
        this.allowedTransitions = this.allowedTransitions.filter(item => item.Id != rowId);
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

    get disableApplyProfilesBtn() {
        return !(this.allowedTransitions?.length > 0);
    }
    get isObjectFieldSelected() {
        return this.selectedField ? true : false;
    }
}