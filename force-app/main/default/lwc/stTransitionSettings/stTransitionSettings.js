import { LightningElement, track, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getObjects from '@salesforce/apex/ST_TransitionSettingsController.getObjects';
import getFields from '@salesforce/apex/ST_TransitionSettingsController.getObjectFields';
import getPicklistValues from '@salesforce/apex/ST_TransitionSettingsController.getPicklistValues';
import getProfilesNames from '@salesforce/apex/ST_TransitionSettingsController.getProfilesNames';
import getAllowedTransitions from '@salesforce/apex/ST_TransitionFlowUtility.getAllowedTransitions';
import dmlOnStateTransition from '@salesforce/apex/ST_TransitionSettingsController.dmlOnStateTransition';

export default class StTransitionSettings extends LightningElement {
    @track error;
    @track listObjects;
    @track listObjectFields;
    @track listFieldValues;
    @track isLoading = true;
    @track isTrasitionContentReady = false;
    keyIndex = 0;
    profileDropDownOptions;
    @api selectedObject;
    @api selectedField;
    @track allowedTransitions;
    @track delStateTransitionIds = '';

    get showTransitionSection() {
        return this.selectedObject && this.selectedField;
    }

    @wire(getObjects)
    wiredObjectsName({ error, data }) {
        if (data) {
            console.log('@@@ wiredObjectsName');
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
            /*this.profileDropDownOptions = [{ value: "All Profiles", label: "All Profiles"}];
            for (var key in data) {
                this.profileDropDownOptions.push({ label: data[key], value: key });
            }*/
            console.log('@@@ wireProfiles');
            this.profileDropDownOptions = data.map((profName) => ({ "label": profName, "value": profName }));
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
        this.isTrasitionContentReady = false;

        getPicklistValues({ objectName: this.selectedObject, fieldName: this.selectedField })
            .then((result) => {
                if (result) {
                    this.listFieldValues = [];
                    for (var key in result) {
                        this.listFieldValues.push({ label: result[key], value: key });
                    }
                    this.listFieldValues = this.sortDataByValue(this.listFieldValues);
                }

                return getAllowedTransitions({ objName: this.selectedObject, fieldName: this.selectedField });
            })
            .then((result) => {
                this.allowedTransitions = result;
                this.isTrasitionContentReady = true;
                /*
                this.allowedTransitions = (Array.isArray(result) ? result : []).map((item) => {

                    item = { ...item, profileOptions: [...this.profileDropDownOptions] };

                    if (item.Allowed_Profiles__c) {
                        item.Allowed_Profiles__c.split(",").forEach((profName) => {
                            item.profileOptions.find(profOpt => profOpt.label == profName).selected = true;
                        });
                    }
                    return (item);
                });
                */
            })
            .catch((error) => {
                this.error = error;
            });
    }

    //to add row
    addRow() {
        var newTransition = { From_State__c: "", To_State__c: "", Id: (++this.keyIndex), Allowed_Profiles__c: "", Object__c: this.selectedObject, Field__c: this.selectedField };
        console.log('newTransition - ', newTransition);
        this.allowedTransitions = [...(Array.isArray(this.allowedTransitions) ? this.allowedTransitions : []), newTransition];
    }

    //update table row values in list
    updateValues(event) {
        var editedItem = this.allowedTransitions.find(ele => ele.Id == event.target.dataset.id);
        console.log("editedItem", JSON.stringify(editedItem));
        if (event.target.name === 'From_State__c') {
            editedItem.From_State__c = event.target.value;
        } else if (event.target.name === 'To_State__c') {
            editedItem.To_State__c = event.target.value;
            console.log(' this.allowedTransition - ', JSON.stringify(this.allowedTransitions));
        } else if (event.target.name === 'Allowed_Profiles__c') {
            //editedItem.Allowed_Profiles__c = event.detail.map((item) => item.label).join(",");
            //console.log("AllowedProfiles", JSON.stringify(editedItem.Allowed_Profiles__c));
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
            if (this.delStateTransitionIds !== '') {
                this.delStateTransitionIds = this.delStateTransitionIds.substring(1);
            }

            this.allowedTransitions.forEach(res => {
                if (!isNaN(res.Id)) {
                    res.Id = null;
                }
                /*if (res.Object__c == undefined) {
                    res.Object__c = this.selectedObject;
                }
                if (res.Field__c == undefined) {
                    res.Field__c = this.selectedField;
                }*/
            });
            dmlOnStateTransition({ data: this.allowedTransitions, delST: this.delStateTransitionIds })
                .then(result => {
                    this.showToast('Success', result, 'Success', 'dismissable');
                }).catch(error => {
                    console.log(error);
                    this.showToast('Error updating or refreshing records', error.body.message, 'Error', 'dismissable');
                });
        }
    }

    //To Remove Row
    removeRow(event) {
        console.log('remove rows - ', event.target.dataset.id);
        if (isNaN(event.target.dataset.id)) {
            this.delStateTransitionIds = this.delStateTransitionIds + ',' + event.target.dataset.id;
        }
        this.allowedTransitions = this.allowedTransitions.filter(item => item.Id != event.target.dataset.id);
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
}