// Schema for the Dashboard-DashboardTag Membership classes (many - many)
// - This is to group Dashboards together, like tags, that are related
// - it has NO relationship with the Groups (of users) entitry

// Eazl
export class EazlDashboardTagMembership {
    id: number;
    dashboard_id: number;
    tag: string;
    updated_on: string;                                     // Updated on
    updated_by: string;                                     // Updated by
    created_on: string;                                     // Created on
    created_by: string;                                     // Created by
}

// Canvas
export class DashboardTagMembership {
    dashboardTagID: number;                                 // Unique DB ID
    dashboardID: number;                                    // FK to Dashboard
    dashboardTagName: string;                               // Name of tag linked    
    dashboardTagMembershipCreatedDateTime: string;          // Created on
    dashboardTagMembershipCreatedUserName: string;          // Created by
    dashboardTagMembershipUpdatedDateTime: string;          // Updated on
    dashboardTagMembershipUpdatedUserName: string;          // Updated by
}