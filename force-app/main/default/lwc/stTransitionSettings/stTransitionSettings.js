import { LightningElement, track } from 'lwc';
import getAllObjects from '@salesforce/apex/ST_TransitionSettingsController.getObjects';
import getFields from '@salesforce/apex/ST_TransitionSettingsController.getObjectFields';

export default class StTransitionSettings extends LightningElement {
    @track listObjects;
    @track listObjectFields;
    @track error;

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
                this.listObjects = [{ key: '', value: '' }];
                console.log("result", result);
                if (result) {
                    for (var key in result) {
                        this.listObjects.push({ value: result[key], key: key }); //Here we are creating the array to show on UI.
                    }
                    this.listObjects = this.sortDataByValue(this.listObjects);
                    console.log("listObjects", this.listObjects);
                }

            })
            .catch(error => {
                this.error = error;
            });

    }

    onObjectChange(event) {
        this.listObjectFields = [{ key: "", value: "" }];

        const selectedObject = event.target.value;
        console.log("selectedObject", selectedObject);

        getFields({ objectName: selectedObject })
            .then((result) => {
                console.log(result);
                if (result) {
                    for (var key in result) {
                        this.listObjectFields.push({ value: result[key], key: key }); //Here we are creating the array to show on UI.
                    }
                    this.listObjectFields = this.sortDataByValue(this.listObjectFields);
                    console.log("listObjects", this.listObjectFields);
                }

            })
            .catch((error) => {
                this.error = error;
            });
    }

    sortDataByValue(records) {
        return records.sort((a, b) => (a.value < b.value) ? -1 : ((b.value > a.value) ? 1 : 0))
    }
}