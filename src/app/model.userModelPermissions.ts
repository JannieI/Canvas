// Schema for types of permissions per user:
// At model level, and at object level

export class EazlUserModelPermission {
    model: string;                                  // Model, ie query or dashboard
    model_permissions: string[];                    // Type, ie add_dashboard, change_dashboard
    object_permissions: {
        assign_permission_query: {
                object_id: number[]
        };
        change_query: {
                object_id: number[]
        };
        delete_query: {
                object_id: number[]
        };
        remove_permission_query: {
                object_id: number[]
        };
        view_query: {
                object_id: number[]
        };
        assign_permission_dashboard: {
                object_id: number[]
        };
        change_dashboard: {
                object_id: number[]
        };
        delete_dashboard: {
                object_id: number[]
        };
        remove_permission_dashboard: {
                object_id: number[]
        };
        view_dashboard: {
                object_id: number[]
        };
        assign_permission_package: {
                object_id: number[]
        };
        change_package: {
                object_id: number[]
        };
        delete_package: {
                object_id: number[]
        };
        remove_permission_package: {
                object_id: number[]
        };
        view_package: {
                object_id: number[]
        };
    };
}

// Canvas
export class UserModelPermission {
    model: string;
    modelPermissions: string[];
    objectPermissions: [
        {
            permission: string;
            objectID: number[]
        }
    ];
}

// Flattened version of the above, which works easier in p-tables, etc
export class UserModelPermissionFlat {
        modelID: number;                            // Dashboard ID
        modelName: string;                          // Dashboard Name
        username: string;                           // User who has access
        modelPermissionsAccessVia: string;          // Username or Group
        objectPermission: string   ;                // Permission in DB: remove_permission_dashboard, etc
    }