public with sharing class ST_TransitionSettingsController {
    @AuraEnabled(cacheable=true)
    public static Map<String,String> getObjects(){
        Map<String,String> objectMap = new Map<String,String>();
        for(Schema.SObjectType objTyp : Schema.getGlobalDescribe().Values()){
           String name = objTyp.getDescribe().getName();
           String label = objTyp.getDescribe().getLabel();
           if(!name.containsignorecase('history') && !name.containsignorecase('tag') &&
                !name.containsignorecase('share') && !name.containsignorecase('feed') && 
               	!name.containsignorecase('group') && !name.containsignorecase('public') &&
                !objTyp.getDescribe().isCustomSetting() && objTyp.getDescribe().isCreateable() &&
                objTyp.getDescribe().getRecordTypeInfos().size() > 0){      
                objectMap.put(name,label);
           }
        }
		System.debug(objectMap);
        if(objectMap != null && objectMap.size() > 0){
        	return objectMap;   
        }else{
            return null;
        }
    }

    @AuraEnabled(cacheable=true)
    public static Map<String,String> getObjectFields(String objectName){
        Map<String,String> mapFieldNames = new Map<String,String>();

        SObjectType objectType = Schema.getGlobalDescribe().get(objectName);
        Map<String,Schema.SObjectField> mapFields = objectType.getDescribe().fields.getMap();

        for(String fieldName : mapFields.keySet()){
            Schema.SObjectField field = mapFields.get(fieldName);
            Schema.DescribeFieldResult descFieldRes = field.getDescribe();
            Schema.DisplayType FIELD_TYPE = descFieldRes.getType();
            if(FIELD_TYPE == Schema.DisplayType.PICKLIST) {
                mapFieldNames.put(descFieldRes.getName(), descFieldRes.getLabel());
            }
        }

        return mapFieldNames;
    }

    @AuraEnabled(cacheable=true)
    public static Map<String,String> getPicklistValues(String objectName, String fieldName){
        Map<String,String> mapPicklistValues = new Map<String,String>();

        Schema.PicklistEntry[] picklistEntries = Schema.getGlobalDescribe().get(objectName).getDescribe().fields.getMap().get(fieldName).getDescribe().getPicklistValues();

        for (Schema.PicklistEntry entry : picklistEntries) {
            if (entry.isActive()) {
                mapPicklistValues.put(entry.getValue() , entry.getLabel());
            }
        }
        
        return mapPicklistValues;
    }

    @AuraEnabled(cacheable=true)
    public static String[] getProfilesNames(){
        String[] listProfileNames = new String[]{};

        Profile[] listProfiles = [SELECT Id, Name FROM Profile order by Name];

        for(Profile p : listProfiles) {
            listProfileNames.add(p.Name);
        }
        
        return listProfileNames;
    }

    @AuraEnabled
    public static string dmlOnStateTransition(Object data) {
        List<State_Transition__c> upsertST = (List<State_Transition__c>) JSON.deserialize(JSON.serialize(data), List<State_Transition__c>.class);
        try {
            if(upsertST != null && !upsertST.isEmpty()){
                insert upsertST;
            }
            return 'Success: State Transition(s) insert successfully';
        }
        catch (Exception e) {
            String errorMsg = 'The following exception has occurred: ' + e.getMessage();
            throw new AuraHandledException(ErrorMsg);
        }
    }
}