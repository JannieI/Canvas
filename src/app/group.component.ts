// Group form
import { Component }                  from '@angular/core';
import { OnInit }                     from '@angular/core';
import { ViewEncapsulation }          from '@angular/core';

// PrimeNG
import { ConfirmationService }        from 'primeng/primeng';
import { MenuItem }                   from 'primeng/primeng';
import { Message }                    from 'primeng/primeng';

// Our Components

// Our Services
import { EazlService }                from './eazl.service';
import { GlobalFunctionService }      from './global-function.service';
import { GlobalVariableService }      from './global-variable.service';

// Our models
import { DataModelPermissionFlat }    from './model.dataPermissions';
import { DataObjectPermissionFlat }   from './model.dataPermissions';
import { DataSource }                 from './model.datasource';
import { EazlUser }                   from './model.user';
import { Group }                      from './model.group';
import { User }                       from './model.user';

@Component({
    selector:    'group',
    templateUrl: 'group.component.html',
    styleUrls:  ['group.component.css'],
    encapsulation: ViewEncapsulation.None
})

export class GroupComponent implements OnInit {

    // Local properties
    addEditMode: string;                                // Add/Edit to indicate mode
    availableUserGroupMembership: string[] = [];          // List of Users NOT belonging to Group
    belongstoUserGroupMembership: string[] = [];          // List of Users already in Group
    dataModelPermissionsFlat: DataModelPermissionFlat[];        // @Runtime List of Model Permissions per User
    dataObjectPermissionsFlat: DataObjectPermissionFlat[];      // @Runtime List of Model Permissions per User
    displayGroupMembership: boolean = false;            // True to display popup for GrpMbrship
    displayGroupPopup: boolean = false;                 // True to display single User
    displayDataModelPermissions: boolean = false;       // True to display popup for Model Permissions
    displayDataObjectPermissions: boolean = false;      // True to display popup for Object Permissions
    groups: Group[] = [];                               // List of Groups
    popupHeader: string = 'Group Maintenance';          // Popup header
    popuMenuItems: MenuItem[];                          // Items in popup
    selectedGroup: Group;                               // User that was clicked on

    constructor(
        private confirmationService: ConfirmationService,
        private eazlService: EazlService,
        private globalFunctionService: GlobalFunctionService,
        private globalVariableService: GlobalVariableService,
        ) {
    }

    ngOnInit() {
        // Form initialisation
        this.globalFunctionService.printToConsole(this.constructor.name,'ngOnInit', '@Start');

        // Initialise variables
        this.groups = this.eazlService.getGroups();

        this.popuMenuItems = [
            {
                label: 'Add',
                icon: 'fa-plus',
                command: (event) => this.groupMenuAdd(this.selectedGroup)
            },
            {
                label: '______________________',
                icon: '',
                disabled: true
            },
            {
                label: 'Edit',
                icon: 'fa-pencil',
                command: (event) => this.groupMenuEdit(this.selectedGroup)
            },
            {
                label: 'Delete',
                icon: 'fa-minus',
                command: (event) => this.groupMenuDelete(this.selectedGroup)
            },
            {
                label: 'Users in Group',
                icon: 'fa-users',
                command: (event) => this.groupMenuGroupMembership(this.selectedGroup)
            },
            {
                label: 'Datasource Permis.',
                icon: 'fa-list',
                command: (event) => this.groupMenuModelPermissions(
                    this.selectedGroup,
                    'package',
                    'ModelFlat'
                )
            },
            {
                label: 'Dashboard Permis.',
                icon: 'fa-list',
                command: (event) => this.groupMenuModelPermissions(
                    this.selectedGroup,
                    'dashboard',
                    'ModelFlat'
                )
            },
            {
                label: 'Datasources',
                icon: 'fa-database',
                command: (event) => this.groupMenuModelPermissions(
                    this.selectedGroup,
                    'package',
                    'ObjectFlat'
                )
            },
            {
                label: 'Dashboards',
                icon: 'fa-database',
                command: (event) => this.groupMenuModelPermissions(
                    this.selectedGroup,
                    'dashboard',
                    'ObjectFlat'
                )
            },

        ];

    }

    groupMenuAdd(group: Group) {
        // Popup form to add a new gUserGroupMembershiproup
        // - group: currently selected row
        this.globalFunctionService.printToConsole(this.constructor.name,'groupMenuAdd', '@Start');
        this.addEditMode = 'Add';
        this.displayGroupPopup = true;
    }

    groupMenuEdit(group: Group) {
        // Edit selected group on a popup form
        // - group: currently selected row
        this.globalFunctionService.printToConsole(this.constructor.name,'groupMenuEdit', '@Start');

        this.globalVariableService.growlGlobalMessage.next({
            severity: 'info',
            summary:  'Selected group',
            detail:   group.groupName
        });

        this.addEditMode = 'Edit';
        this.displayGroupPopup = true;
    }

    groupMenuDelete(group: Group) {
        // Delete the selected group, but first confirm
        // - group: currently selected row
        this.globalFunctionService.printToConsole(this.constructor.name,'groupMenuDelete', '@Start');

        this.confirmationService.confirm({
            message: 'Are you sure that you want to delete this record?',
            reject: () => {
                return;
            },
            accept: () => {

                this.eazlService.deleteGroup(this.selectedGroup);
            }
        })
    }

    onClickGroupTable() {
        // User clicked on a row
        this.globalFunctionService.printToConsole(this.constructor.name,'onClickGroupTable', '@Start');

        // Update the group group membership if it is open
        if (this.displayGroupMembership) {
            this.groupMenuGroupMembership(this.selectedGroup)
        }

    }

    groupMenuGroupMembership(group: Group) {
        // Manage users that belong to this group
        // - group: currently selected row
        this.globalFunctionService.printToConsole(this.constructor.name,'groupMenuGroupMembership', '@Start');

        this.belongstoUserGroupMembership = this.selectedGroup.users;
        this.availableUserGroupMembership = this.eazlService.getUsersListComplement(
            this.selectedGroup.users
        );

        // Show popup
        this.displayGroupMembership = true;
    }

    onMoveUpdateUserGroupMembership(event) {
        // User clicked onMoveToTarget on Group Membership: add grp membership
        this.globalFunctionService.printToConsole(this.constructor.name,'onMoveUpdateUserGroupMembership', '@Start');

        this.selectedGroup.users = this.belongstoUserGroupMembership;
        this.eazlService.updateGroup(this.selectedGroup)
    }

    onClickGroupMembershipCancel() {
        // User clicked Cancel button on Group Membership panel
        this.globalFunctionService.printToConsole(this.constructor.name,'onClickGroupMembershipCancel', '@Start');

        // Close popup
        this.displayGroupMembership = false;
    }

    groupMenuModelPermissions(group: Group, model: string, format: string) {
        // Show Model Permissions (dashboard, dastasources) to which the given group has access
        // - group: currently selected row
        // - model to filter on, ie 'dashboard'
        // - format: ModelFlat (flat array of model permissions), ObjectFlat (flat array of
        //           object permissions), All (json-like structure of ALL the permission)
        this.globalFunctionService.printToConsole(this.constructor.name,'groupMenuModelPermissions', '@Start');

        this.eazlService.getUserPermissions(
            group.groupID,
            'groups',
            model,
            format
        )
            .then(dataMdlPerm => {
                
                // Show the correct popup
                if (format == 'ModelFlat') {
                    this.dataModelPermissionsFlat = dataMdlPerm;
                    this.displayDataModelPermissions = true;
                } else {
                    this.dataObjectPermissionsFlat = dataMdlPerm;
                    this.displayDataObjectPermissions = true;
                }
            })
            .catch(error => {
                this.globalVariableService.growlGlobalMessage.next({
                    severity: 'warn',
                    summary:  'Related Model Permissions',
                    detail:   'Unsuccessful in reading related model permissions from the database'
                });
                error.message || error
            })
    }

    handleGroupPopupFormClosed(howClosed: string) {
        // Handle the event: howClosed = Cancel / Submit
        this.globalFunctionService.printToConsole(this.constructor.name,'handleGroupPopupFormClosed', '@Start');

        this.displayGroupPopup = false;
    }
}

// Notes for PrimeNG p-table newbees:
//  Filtering is enabled by setting the filter property as true in column object.
//  Default match mode is "startsWith" and this can be configured
//  using filterMatchMode property of column object that also accepts "contains", "endsWith",
//  "equals" and "in". An optional global filter feature is available to search all fields with a keyword.
//  By default input fields are generated as filter elements and using templating any component
//  can be used as a filter.