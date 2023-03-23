global with sharing class ST_TransitionFlowUtility { 
    static Map<String, State_Transition__c[]> mapFieldTransitions;
    static User currUser;

    static {
        currUser = [select Id, Profile.Name from User where Id = :UserInfo.getuserid()];

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
                String[] listAllowedProfiles = stringToArray(st.Allowed_Profiles__c);

                if(st.From_State__c == fromState 
                    && (listAllowedProfiles.isEmpty() || listAllowedProfiles.contains(currUser.Profile.Name))) {

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
                String[] listAllowedProfiles = stringToArray(st.Allowed_Profiles__c);
                
                if(st.From_State__c == fromState && st.To_State__c == toState
                    && (listAllowedProfiles.isEmpty() || listAllowedProfiles.contains(currUser.Profile.Name))) {
                        return true;
                }
            }
        }

        return false;
    }

    private static String[] stringToArray(String str) {
        String[] tokens = new String[]{};

        if(str != null) {
            for(String token : str.split(',')) {
                tokens.add(token.trim());
            }
        }

        return tokens;
    }
}