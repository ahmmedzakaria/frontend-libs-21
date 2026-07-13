import {ActionTypes} from "./action-types";

export interface ApiEndpoint {
    service: string;            // Logical service name
    apiPath: string;            // API relative path
    actionType: ActionTypes;    // Enum for CRUD/Login/etc.
    isMultiPart?: boolean;      // Optional flag for FormData
}
