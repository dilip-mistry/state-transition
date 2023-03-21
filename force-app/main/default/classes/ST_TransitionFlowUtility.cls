global with sharing class ST_TransitionFlowUtility { 
    static Map<String, State_Transition__c[]> mapFieldTransitions;

    static {
        mapFieldTransitions = new Map<String, State_Transition__c[]>();

        for(State_Transition__c st : [select Id, Object__c, Field__c, From_State__c, To_State__c, Allowed_Profiles__c
                                    from State_Transition__c]) {
            String key = st.Object__c + '-' + st.Field__c;

            if(!mapFieldTransitions.containsKey(key)) {
                mapFieldTransitions.put(key, new State_Transition__c[]{});
            }
            mapFieldTransitions.get(key).add(st);
        }
    }
    

    @AuraEnabled(cacheable=true)
    global static State_Transition__c[] getAllowedTransitions(String objName, String fieldName) {
        String key = objName + '-' + fieldName;
        if(mapFieldTransitions.containsKey(key)) {
            return mapFieldTransitions.get(key);
        }
        return null;
    }

    @AuraEnabled(cacheable=true)
    global static String[] getAllowedTransitionsFrom(String objName, String fieldName, String fromState) {
        String[] listAllowedStates = new String[]{};
        
        String key = objName + '-' + fieldName;

        if(mapFieldTransitions.containsKey(key)) {
            for(State_Transition__c st : mapFieldTransitions.get(key)) {
                if(st.From_State__c == fromState) {
                    listAllowedStates.add(st.To_State__c);
                }
            }
    
            return listAllowedStates;
        }
        return null;
    }

    global static boolean isValidTransition(String objectName, String fieldName, String fromState, String toState) {
        String key = objectName + '-' + fieldName;

        if(mapFieldTransitions.containsKey(key)) {
            for(State_Transition__c st : mapFieldTransitions.get(key)) {
                if(st.From_State__c == fromState && st.To_State__c == toState) {
                    return true;
                }
            }
        }

        return false;
    }
}