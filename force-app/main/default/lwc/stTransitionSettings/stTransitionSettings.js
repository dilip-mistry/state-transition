import { LightningElement, track } from 'lwc';
import getAllObjects from '@salesforce/apex/ST_TransitionSettingsController.getObjects';
import getFields from '@salesforce/apex/ST_TransitionSettingsController.getObjectFields';

export default class StTransitionSettings extends LightningElement {
    @track listObjects;
    @track listObjectFields;
    @track error;

    @track selectedObject;
    @track selectedField;

    @track transitionData = [];
    @track columns = [
        { label: 'From', fieldName: 'from' },
        { label: 'To', fieldName: 'to' },
        { label: 'Allowed Profiles', fieldName: 'allowedProfiles' }
    ];

    validTransition = [
        { from: "New", to: "In Progress" },
        { from: "In Progress", to: "Closed" },
        { from: "Closed", to: "Reopen" },
        { from: "Closed", to: "In Progress" },
        { from: "Reopen", to: "In Progress" }
    ];


    connectedCallback() {
        getAllObjects()
            .then(result => {
                if (result) {
                    this.listObjects = [{ value: '', label: '' }];
                    for (var key in result) {
                        this.listObjects.push({ label: result[key], value: key }); //Here we are creating the array to show on UI.
                    }
                    this.listObjects = this.sortDataByValue(this.listObjects);
                }

            })
            .catch(error => {
                this.error = error;
            });

    }

    handleObjectChange(event) {
        this.selectedObject = event.detail.value;
        this.selectedField = null;

        getFields({ objectName: this.selectedObject })
            .then((result) => {
                if (result) {
                    this.listObjectFields = [{ value: "", label: "" }];
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

    handleFieldChange(event) {
        this.selectedField = event.detail.value;
        console.log("Selected Field:" + this.selectedField);
    }

    sortDataByValue(records) {
        return records.sort((a, b) => (a.label < b.label) ? -1 : ((b.label > a.label) ? 1 : 0))
    }
}