// Dashboard Builder
import { AfterViewInit }              from '@angular/core';
import { Component }                  from '@angular/core';
import { Directive }                  from '@angular/core';
import { ElementRef }                 from '@angular/core';
import { HostListener }               from '@angular/core';
import { OnInit }                     from '@angular/core';
import { QueryList }                  from '@angular/core';
import { Renderer }                   from '@angular/core';
import { ViewEncapsulation }          from '@angular/core';
import { ViewChild }                  from '@angular/core';
import { ViewChildren }               from '@angular/core';

import { Inject }                     from "@angular/core";
import { DOCUMENT }                   from '@angular/platform-browser';

//  PrimeNG stuffies
import { ConfirmationService }        from 'primeng/primeng';
import { MenuItem }                   from 'primeng/primeng';
import { SelectItem }                 from 'primeng/primeng';

// Our Components
import { DashboardEditorComponent }   from './dashboard-editor.component';

// Our Services
import { CanvasDate }                 from './date.services';
import { EazlService }                from './eazl.service';
import { GlobalFunctionService }      from './global-function.service';
import { GlobalVariableService }      from './global-variable.service';

// Our models
import { CanvasColors }               from './chartcolors.data';
import { Dashboard }                  from './model.dashboards';
import { DashboardTab }               from './model.dashboardTabs';
import { Filter }                     from './model.filter';
import { Report }                     from './model.report';
import { SelectedItem }               from './model.selectedItem';
import { SelectedItemColor }          from './model.selectedItemColor';
import { Widget }                     from './model.widget';

// Vega stuffies
let vg = require('vega/index.js');


@Component({
    moduleId: module.id,
    selector: 'dashboard-component',
    templateUrl: 'dashboard.component.html',
    styleUrls: ['dashboard.component.css'],
})

export class DashboardComponent implements OnInit, AfterViewInit {
    @ViewChildren('widgetContainter')   childrenWidgetContainers: QueryList<ElementRef>;    // Attaches to # in DOM
    @ViewChildren('widgetText')         childrenWidgetText: QueryList<ElementRef>;          // Attaches to # in DOM
    @ViewChildren('widget')             childrenWidgets: QueryList<ElementRef>;             // Attaches to # in DOM
    @ViewChildren('widgetTable')        childrenWidgetTable: QueryList<ElementRef>;         // Attaches to # in DOM
    @ViewChildren('widgetImage')        childrenWidgetImage: QueryList<ElementRef>;         // Attaches to # in DOM
    @ViewChild(DashboardEditorComponent) dashboardEditor;                                   // To run methods in it

    @HostListener('document:keyup', ['$event'])
    handleKeyboardEvent(event) {
        // Determines raw (x,y) change, and calls routine that does movement

        if (event.code == 'ArrowUp') {
            let offsetLeft = 0;
            let offsetTop  = this.gridSize * -1;
            this.moveWidgets(offsetLeft, offsetTop);
        }
        if (event.code == 'ArrowDown') {
            let offsetLeft = 0;
            let offsetTop  = this.gridSize;
            this.moveWidgets(offsetLeft, offsetTop);
        }
        if (event.code == 'ArrowLeft') {
            let offsetLeft = this.gridSize * -1;
            let offsetTop  = 0;
            this.moveWidgets(offsetLeft, offsetTop);
        }
        if (event.code == 'ArrowRight') {
            let offsetLeft = this.gridSize;
            let offsetTop  = 0;
            this.moveWidgets(offsetLeft, offsetTop);
        }
        if (event.code == 'Delete') {
            this.deleteSelectedWidgets();
        }
    }

    // Current status of Dashboard
    chartWidth: number;
    checkedScale: number;
    displayAdvancedDashboardFilter: boolean = false;
    hasAdvancedFilter: boolean = false;
    radioLabelval1: number;
    refreshDashboard: boolean = false;

    displayMessageManager: boolean = false;
    selectedWidgetName: string;

    // Currently selected stuffies
    currentFilter: Filter;
    numberUntitledDashboards: number = 0;           // Suffix in naming new dashboards, Untitled + n
    numberUntitledTabs: number = 0;                 // Suffix in naming new tabs, Untitled + n
    selectedMessageWidgetID: number;                // Current WidgetID for Messages
    selectedDashboard: SelectedItem;                // Selected Dashboard
    selectedDashboardTab: SelectedItem;             // Current DashboardTab
    selectedWidget: Widget = null;                  // Selected widget during dragging
    selectedWidgetIDs: number[] = [];               // Array of WidgetIDs selected with mouse

    // Currently selected properties for a Widget, in the Palette
    selectedBackgroundColor: SelectedItemColor;     // Selected bg color
    dashboardBackgroundColor: SelectedItemColor;    // Bg Color for the Dashboard body
    dashboardBackgroundImageSrc: SelectedItem;      // Image Src for the Dashboard body
    selectedItem: SelectedItem;                     // Selected Object: note ANY to cater for ID number, string
    selectedItemColor: SelectedItemColor;           // Selected Object: note ANY to cater for ID number, string
    selectedBorder: SelectedItem;
    selectedBoxShadow: SelectedItem;
    selectedColor: SelectedItemColor;
    selectedContainerFontSize: SelectedItem;      // In em
    selectedContainerGridSize: number;      // In px
    showContainerHeader: boolean = true;

    // List of Dashboards read from DB
    dashboardDropDown: SelectItem[];
    dashboards: Dashboard[];

    // Tab stuffies, per Dashboard
    dashboardTabs: DashboardTab[];
    dashboardTabsDropDown:  SelectItem[];

    // Reports used, filled as and when used.  Some has data
    reports: Report[] = [];

    // Widget stuffies, per Dashboard
    containerStartX: number;                    // X of widget at drag start
    containerStartY: number;                    // Y of widget at drag start
    widgets: Widget[];                          // List of Widgets for a selected Dashboard
    widgetEndDragX: number;                     // End coordinates during dragging
    widgetEndDragY: number;                     // End coordinates during dragging
    widgetStartDragX: number;                   // Start coordinates during dragging
    widgetStartDragY: number;                   // Start coordinates during dragging

    // Variables for Startup properties of a Widget
    borderDropdowns: SelectItem[];              // Options for Border DropDown
    boxShadowDropdowns: SelectItem[];           // Options for Box-Shadow DropDown
    chartColor: SelectItem[];                   // Options for Backgroun-dColor DropDown
    fontSizeDropdowns: SelectItem[];            // Options for Font Size
    gridSizeDropdowns: SelectItem[];            // Options for Grid Size
    isContainerHeaderDark: boolean = false;     // Widget Header icons black if true
    gridSize: number;                           // Size of grid blocks, ie 3px x 3px
    snapToGrid: boolean = true;                 // If true, snap widgets to gridSize
    sampleColorWidgetBackgroundColor: string;   // Sample color of that selected from DropDown
    backgroundImageOptions: SelectItem[];       // Dashboard background images

    // Popup forms stuffies
    addEditModeWidgetEditor: string = '';       // Add or Edit was called
    deleteMode: boolean = false;                // True while busy deleting
    displayDashboardDetails: boolean = false;   // T/F to show Dashboard Details form
    displayTabDetails: boolean = false;         // T/F to show Tab Details form
    widgetIDtoEdit: number;                     // ID of Widget being Editted (need to in *ngFor)
    displayEditWidget: boolean = false;         // T/F to show Widget Builder Popup form
    widgetDraggingEnabled: boolean = false;     // T/F to tell when we are in dragging mode
    widgetToEdit: Widget;                       // Widget to edit
    widgetToEditX: number;                      // X coordinate where new widget belongs
    widgetToEditY: number;                      // Y coordinate where new widget belongs

    // Expansion Areas when Widget buttons are clicked
    displayExpandBackgroundArea: boolean = false;
    displayExpandBorder: boolean = false;
    displayExpandBoxShadow: boolean = false;
    displayExpandColor: boolean = false;
    displayExpandFontSize: boolean = false;
    displayExpandGridSize: boolean = false;
    displayExpandDashboardSettings: boolean = false;

    constructor(
        private canvasColors: CanvasColors,
        private canvasDate: CanvasDate,
        private confirmationService: ConfirmationService,
        private eazlService: EazlService,
        private element : ElementRef,
        private globalFunctionService: GlobalFunctionService,
        private globalVariableService: GlobalVariableService,
        private renderer : Renderer,
        @Inject(DOCUMENT) private document: Document
    ) {
     }

    ngOnInit() {
        // Initialise:  Initialize the directive/component after Angular first displays
        // the data-bound properties and sets the directive/component's input properties.
        // Called once, after the first ngOnChanges().
        this.globalFunctionService.printToConsole(this.constructor.name,'ngOnInit', '@Start');

        // Permanent settings and options for form

        // Background Colors Options
        this.chartColor = [];
        this.chartColor = this.canvasColors.getColors();

        // Border Options
        this.borderDropdowns = [];
        this.borderDropdowns = this.eazlService.getBorderDropdowns();

        // BoxShadow Options
        this.boxShadowDropdowns = [];
        this.boxShadowDropdowns = this.eazlService.getBoxShadowDropdowns();

        // Font Size Options
        this.fontSizeDropdowns = [];
        this.fontSizeDropdowns = this.eazlService.getFontSizeDropdowns();

        // Grid Size Options - the name must be a NUMBER, in px
        this.gridSizeDropdowns = [];
        this.gridSizeDropdowns = this.eazlService.getGridSizeDropdowns();

        // Background Images
        this.backgroundImageOptions = [];
        this.backgroundImageOptions = this.eazlService.getBackgroundImageDropdowns();

        // Set startup stuffies
        // TODO - make sure global vars obtained @startup / login
        //      - and maintained when they change via WebSocket messages
        this.snapToGrid = this.globalVariableService.snapToGrid;
        this.gridSize = this.globalVariableService.gridSize;
        this.selectedBackgroundColor = this.globalVariableService.lastBackgroundColor;
        this.selectedBorder = this.globalVariableService.lastBorder;
        this.selectedBoxShadow = this.globalVariableService.lastBoxShadow;
        this.selectedColor = this.globalVariableService.lastColor;
        this.selectedContainerFontSize = this.globalVariableService.lastContainerFontSize;

        // Get the list of dashboards from the DB
        this.getDashboards()

        // Set the Dashboard ID to load on Init
        if (this.globalVariableService.sessionLoadOnOpenDashboardID == null) {
            if (this.globalVariableService.startupDashboardID != null) {
                this.globalVariableService.sessionLoadOnOpenDashboardID =
                    this.globalVariableService.startupDashboardID;
                this.globalVariableService.sessionLoadOnOpenDashboardName =
                    this.dashboards.filter(dash =>
                        dash.dashboardID == this.globalVariableService.startupDashboardID)
                        [0].dashboardName
                    }
        }

        // Call if anyone is eligible
        if (this.globalVariableService.sessionLoadOnOpenDashboardID != null) {
            this.selectedDashboard =
                {
                    id: this.globalVariableService.sessionLoadOnOpenDashboardID,
                    name: this.globalVariableService.sessionLoadOnOpenDashboardName
                }

                // Load the Tabs for this Dashboard
            this.loadDashboardTabsBody(this.globalVariableService.sessionLoadOnOpenDashboardID);
            // Use startup Dashboard Tab ID at the very beginning
            if (this.globalVariableService.sessionDashboardTabID == null) {
                if (this.globalVariableService.startupDashboardTabID != null) {
                    this.globalVariableService.sessionDashboardTabID =
                        this.globalVariableService.startupDashboardTabID
                }
            }

            // Load the session's Dashboard Tab
            if (this.globalVariableService.sessionDashboardTabID != null) {

                // Get the Dashboard Tab Name, used by drop down (value = id, name)
                let sessionDashboardTabName: string = ''
                if (this.globalVariableService.sessionDashboardTabID != null) {
                    let workingDashboardTab: DashboardTab[] = this.eazlService.getDashboardTabs(
                        this.globalVariableService.sessionLoadOnOpenDashboardID,
                        this.globalVariableService.sessionDashboardTabID);
                    if (workingDashboardTab.length != 0) {
                        sessionDashboardTabName = workingDashboardTab[0].dashboardTabName;
                    }
                }

                this.selectedDashboardTab = {
                    id: this.globalVariableService.sessionDashboardTabID,
                    name: sessionDashboardTabName
                }
                this.loadDashboard();
            }
        }
    }

    ngAfterViewInit() {
        // View initialised, after changes
        // Respond after Angular initializes the component's views and child views.
        // Called once after the first ngAfterContentChecked().
        // The DOM is now initialised, so the ViewChildren are available

        // This thing is called many, many times !!!  Basically whenever the mouse moves, etc
        // So, I dont think we should log it.
        // this.globalFunctionService.printToConsole(this.constructor.name,'ngAfterViewInit', '@Start');
        // TODO - delete this makker as its empty ?
    }

    ngAfterViewChecked() {
        //  Respond after Angular checks the component's views and child views.
        // Called after the ngAfterViewInit and every subsequent ngAfterContentChecked().

        // TODO - this thing fires ALL the time.  Should we have it ?
        // this.globalFunctionService.printToConsole(this.constructor.name,'ngAfterViewChecked', '@Start');

        // Refresh the Dashboard; once
        if (this.refreshDashboard) {
            this.dashboardRefresh();
            this.refreshDashboard = false;
        }
    }

    public handleformDashboarTabSubmit(event){
        // Is triggered after the Dashboard Tab form is submitted
        this.globalFunctionService.printToConsole(this.constructor.name,'handleformDashboarTabSubmit', '@Start');

        // Hide popup
        this.displayTabDetails = false;
    }

    public handleFormSubmit(returnedFilter: Filter): void {
        // Is triggered after the Advanced Filter form is submitted
        this.globalFunctionService.printToConsole(this.constructor.name,'handleFormSubmit', '@Start');

        // Nothing filters, had filter before: reset Dashboard Dropdown
        if (!returnedFilter.hasAtLeastOneFilter) {

            this.currentFilter = null;

            if (this.hasAdvancedFilter) {
                this.hasAdvancedFilter = false;
                let emptyFilter: Filter = null;
                this.resetDashboardDropDowns(emptyFilter);
            }
        }
        else {
            this.currentFilter = returnedFilter;

            this.hasAdvancedFilter = true;
            this.resetDashboardDropDowns(returnedFilter);
        }

        // Close the popup
        this.displayAdvancedDashboardFilter = false;
    }

    public handleWidgetBuilderFormSubmit(returnCode: string): void {
        // Is triggered after the Advanced Filter form is submitted
        this.globalFunctionService.printToConsole(this.constructor.name,'handleWidgetBuilderFormSubmit', '@Start');

        // Bail if Popup was Cancelled
        if (returnCode == "Cancel") {

            // Close the popup form for the Widget Builder
            this.displayEditWidget = false;

            return;
        }

        // Add new Widget to Array
        if (this.addEditModeWidgetEditor == "Add") {

            // Add the new guy to the Array, if it belongs to current Dashboar
            if (this.widgetToEdit.properties.dashboardTabName ==
                this.selectedDashboardTab.name) {

                // Set the Widget ID & Add to Array
                this.widgetToEdit.properties.widgetID =
                    this.eazlService.getWidgetLastWidgetID();
                this.widgets.push(this.widgetToEdit);

                // Refresh the Dashboard
                this.refreshDashboard = true;
            }

            // Inform the user
            this.globalVariableService.growlGlobalMessage.next({
                severity: 'info',
                summary:  'Success',
                detail:   'Widget added'
            });
        }

        // Save the editted Widget back to the Array
        if (this.addEditModeWidgetEditor == "Edit") {

            // Loop on the Array, find the editted one and update
            for (var i = 0; i < this.widgets.length; i++) {

                if (this.widgets[i].properties.widgetID ===
                    this.widgetToEdit.properties.widgetID) {

                        // Update individual fields: if you replace the whole Array
                        // entry, everything dies.  Including position, svg rendered, etc
                        this.widgets[i].container.widgetTitle =
                            this.widgetToEdit.container.widgetTitle;
                        this.widgets[i].properties.dashboardTabName =
                            this.widgetToEdit.properties.dashboardTabName;
                        this.widgets[i].properties.widgetCode =
                            this.widgetToEdit.properties.widgetCode;
                        this.widgets[i].properties.widgetName =
                            this.widgetToEdit.properties.widgetName;
                        this.widgets[i].properties.widgetDescription =
                            this.widgetToEdit.properties.widgetDescription;
                        this.widgets[i].properties.widgetHyperLinkTabNr =
                            this.widgetToEdit.properties.widgetHyperLinkTabNr;
                        this.widgets[i].properties.widgetHyperLinkWidgetID =
                            this.widgetToEdit.properties.widgetHyperLinkWidgetID;
                        this.widgets[i].properties.widgetRefreshMode =
                            this.widgetToEdit.properties.widgetRefreshMode;
                        this.widgets[i].properties.widgetRefreshFrequency =
                            this.widgetToEdit.properties.widgetRefreshFrequency;
                        this.widgets[i].properties.widgetDefaultExportFileType =
                            this.widgetToEdit.properties.widgetDefaultExportFileType;
                        this.widgets[i].properties.widgetPassword =
                            this.widgetToEdit.properties.widgetPassword;
                        this.widgets[i].properties.widgetReportName =
                            this.widgetToEdit.properties.widgetReportName;
                        this.widgets[i].properties.widgetReportParameters =
                            this.widgetToEdit.properties.widgetReportParameters;
                        this.widgets[i].properties.widgetShowLimitedRows =
                            this.widgetToEdit.properties.widgetShowLimitedRows;
                        this.widgets[i].properties.widgetAddRestRow =
                            this.widgetToEdit.properties.widgetAddRestRow;
                        this.widgets[i].properties.widgetType =
                            this.widgetToEdit.properties.widgetType;
                        this.widgets[i].properties.widgetUpdatedDateTime =
                            this.widgetToEdit.properties.widgetUpdatedDateTime;
                        this.widgets[i].properties.widgetUpdatedUserName =
                            this.widgetToEdit.properties.widgetUpdatedUserName;
                }
            }

            this.globalVariableService.growlGlobalMessage.next({
                severity: 'info',
                summary:  'Success',
                detail:   'Widget updated'
            });

            // Refresh the Dashboard
            this.refreshDashboard = true;
        }

        // Remove a Widget now allocated to another tab
        if (this.widgetToEdit.properties.dashboardTabName != this.selectedDashboardTab.name) {
            let widgetIndex: number = 0;
            for (var i = 0; i < this.widgets.length; i++) {
                if (this.widgets[i].properties.widgetID ==
                    this.widgetToEdit.properties.widgetID) {
                        widgetIndex = i;
                        break;
                }
            };
            this.widgets.splice(i, 1)
        }

        // Close the popup form for the Widget Builder
        this.displayEditWidget = false;

    }

    applyDashboardSettings() {
        // Apply the Dashboard Settings
        this.globalFunctionService.printToConsole(this.constructor.name,'applyDashboardSettings', '@Start');

        // Set the document / body background color
        if (this.dashboardBackgroundColor) {
            this.document.body.style.backgroundColor =
                this.dashboardBackgroundColor['name'];
        }

        if (this.dashboardBackgroundImageSrc) {
            this.document.body.style.backgroundImage =
                this.dashboardBackgroundImageSrc['name'];
        }
    }

    clickContainerApply(){
        // Apply the new values on the Palette -> Container tab to the selected Widget
        this.globalFunctionService.printToConsole(this.constructor.name,'clickContainerApply', '@Start');

        // First, global stuffies like grid size
        // Grid Size
        if (this.displayExpandGridSize) {

            // Update the data (for next time only, not moving anything now)
            this.globalVariableService.gridSize = +this.selectedContainerGridSize['name'];

            // Remember for next time, permanently
            this.globalVariableService.gridSize = this.gridSize;

            return;
        }

        // Dashboard wide settings
        if (this.displayExpandDashboardSettings) {

            // Apply the Dashboard Settings
            this.applyDashboardSettings();

            this.dashboards.filter(
                dash => dash.dashboardID == this.selectedDashboard.id
            )[0].dashboardBackgroundColor = this.dashboardBackgroundColor.name;
            this.eazlService.updateDashboardBackgroundColor(
                this.selectedDashboard.id,
                this.dashboardBackgroundColor.name
            );

            this.dashboards.filter(
                dash => dash.dashboardID == this.selectedDashboard.id
            )[0].dashboardBackgroundImageSrc = this.dashboardBackgroundImageSrc.name;
            this.eazlService.updateDashboardBackgroundImageSrc(
                this.selectedDashboard.id,
                this.dashboardBackgroundImageSrc.name
            );

            return;
        }


        // Loop on the Array of selected IDs, and do things to it
        for (var i = 0; i < this.selectedWidgetIDs.length; i++) {

            // Loop on the ViewChildren, and act for the Selected One
            let selectedElement = this.childrenWidgetContainers.filter(
                child  => child.nativeElement.id ==  this.selectedWidgetIDs[i].toString())[0]

            if (selectedElement != undefined) {

                // Background Color
                if (this.displayExpandBackgroundArea) {
                    this.renderer.setElementStyle(selectedElement.nativeElement,
                        'background-color', this.selectedBackgroundColor['name']
                    );

                    // Update the data
                    this.widgets.filter(
                        widget => widget.properties.widgetID ===
                            this.selectedWidgetIDs[i])[0].
                                    container.backgroundColor =
                                this.selectedBackgroundColor['name'];

                    // Remember for next time, permanently
                    this.globalVariableService.lastBackgroundColor = this.selectedBackgroundColor;
                }

                // Border
                if (this.displayExpandBorder) {
                    this.renderer.setElementStyle(selectedElement.nativeElement,
                        'border', this.selectedBorder['name']
                    );

                    // Update the data
                    this.widgets.filter(
                        widget => widget.properties.widgetID ===
                            this.selectedWidgetIDs[i])[0].
                                    container.border =
                                this.selectedBorder['name'];

                    // Remember for next time, permanently
                    this.globalVariableService.lastBorder = this.selectedBorder;
                }

                // BoxShadow
                if (this.displayExpandBoxShadow) {
                    this.renderer.setElementStyle(selectedElement.nativeElement,
                        'box-shadow', this.selectedBoxShadow['name']
                    );

                    // Update the data
                    this.widgets.filter(
                        widget => widget.properties.widgetID ===
                            this.selectedWidgetIDs[i])[0].
                                    container.boxShadow =
                                this.selectedBoxShadow['name'];

                    // Remember for next time, permanently
                    this.globalVariableService.lastBoxShadow = this.selectedBoxShadow;
                }

                // Color
                if (this.displayExpandColor) {
                    this.renderer.setElementStyle(selectedElement.nativeElement,
                        'color', this.selectedColor['name']
                    );

                    // Update the data
                    this.widgets.filter(
                        widget => widget.properties.widgetID ===
                            this.selectedWidgetIDs[i])[0].
                                    container.color =
                                this.selectedColor['name'];

                    // Remember for next time, permanently
                    this.globalVariableService.lastColor = this.selectedColor;
                }

                // Font Size
                if (this.displayExpandFontSize) {
                    this.renderer.setElementStyle(selectedElement.nativeElement,
                        'font-size', this.selectedContainerFontSize.name.toString() + 'em'
                    );

                    // Update the data
                    this.widgets.filter(
                        widget => widget.properties.widgetID ===
                            this.selectedWidgetIDs[i])[0].
                                    container.fontSize =
                                +this.selectedContainerFontSize['name'];

                    // Remember for next time, permanently
                    this.globalVariableService.lastContainerFontSize =
                        this.selectedContainerFontSize;

                }
            }
        }
    }

    onClickSnapToGrid() {
        // Toggles snap to grid
        this.globalFunctionService.printToConsole(this.constructor.name,'onClickSnapToGrid', '@Start');

        // Toggle
        this.snapToGrid = !this.snapToGrid;

        // Remember for next time, permanently
        this.globalVariableService.snapToGrid = this.snapToGrid;
    }

    dashboardAdvanceFilter() {
        // Pops up Advance Dashboard Filter
        this.globalFunctionService.printToConsole(this.constructor.name,'dashboardAdvanceFilter', '@Start');

        // Show popup
        this.displayAdvancedDashboardFilter = true
    }

    widgetShiftSelected(idWidget: number): boolean {
        // Return true / false if widget has been shift selected
        // TOD - this thing fires ALL the !@#$%#^%^ time - is that nice?  Better solution?
        // this.globalFunctionService.printToConsole(this.constructor.name,'widgetShiftSelected', '@Start');

        if (this.selectedWidgetIDs.indexOf(idWidget) >= 0) {
            return true
        } else {
            return false;
        }
    }

    changeElementRefProperty(
        elementRef: ElementRef,
        attributeToChange: string,
        newValue:string) {
        // Update the property of a given ElementRef BOTH in the array and in the DOM
        this.globalFunctionService.printToConsole(this.constructor.name,'changeElementRefProperty', '@Start');

        // Update DOM
        if (attributeToChange == 'left') {
            this.renderer.setElementStyle(elementRef.nativeElement,
                'left', newValue + "px"
            );
        }
        if (attributeToChange == 'top') {
            this.renderer.setElementStyle(elementRef.nativeElement,
                'top', newValue + "px"
            );
        }
        if (attributeToChange == 'width') {
            this.renderer.setElementStyle(elementRef.nativeElement,
                'width', newValue + "px"
            );
        }
        if (attributeToChange == 'height') {
            this.renderer.setElementStyle(elementRef.nativeElement,
                'height', newValue + "px"
            );
        }

    }

    deleteSelectedWidgets() {
        // This routine deletes all selected widgets, does ask Okay? for each one
        this.globalFunctionService.printToConsole(this.constructor.name,'deleteSelectedWidgets', '@Start');

        // Nothing to do
        if (this.selectedWidgetIDs.length == 0){
            return
        }

        // Cannot delete multiple: for example, some may be locked, some may be off the
        // screen (thus deleting stuff you are not aware of)

        if (this.selectedWidgetIDs.length != 1){
            this.globalVariableService.growlGlobalMessage.next({
                severity: 'warn',
                summary:  'Locked',
                detail:   'Cannot delete when multiple widgets are selected (only a single one)'
            });
            return
        }

        // Loop on this one and delete - they say for is fasta than .filter
        for (var i = 0; i < this.selectedWidgetIDs.length; i++) {
            this.clickDeleteWidget(this.selectedWidgetIDs[i])
        }
    }

    clickDeleteWidget (idWidget: number) {
        // Delete the Widget, with confirmation of kors
        this.globalFunctionService.printToConsole(this.constructor.name,'clickDeleteWidget', '@Start');

        // Respect the Lock
        let selectedWidget: Widget = this.widgets.filter(
            widget => widget.properties.widgetID ===
                idWidget)[0];
        if (selectedWidget == undefined) {
            return
        }

        if (selectedWidget.properties.widgetIsLocked) {
                this.globalVariableService.growlGlobalMessage.next({
                    severity: 'info',
                    summary:  'Locked',
                    detail:   'First unlock the Widget by clicking on lock, then delete'
                });
                return;
        }

        // See earlier note on deleteMode; its a whole story ...
        this.deleteMode = true;
        if (this.deleteMode) {
            this.confirmationService.confirm({
                message: 'Are you sure that you want to delete this Widget (' +
                    selectedWidget.container.widgetTitle + ' ?',
                accept: () => {
                    this.widgetDeleteIt(idWidget);
                    this.deleteMode = false;
                },
                reject: () => {
                    this.deleteMode = false;
                }
            });
        }
    }

    widgetDeleteIt(idWidget: number) {
        // Delete Widget
        this.globalFunctionService.printToConsole(this.constructor.name,'widgetDeleteIt', '@Start');

        // Bring back the value field of the selected item.
        // Note: deleteMode is important to switch the loop off since we are in an *ngFor
        //       So, switch on when Delete Button is clicked, and switch off after
        //       delete routine is invoked.  Also, the popup is *ngIf-ed to it
        if (this.deleteMode) {
            for (var i = 0; i < this.widgets.length; i++ ) {
                if (this.widgets[i].properties.widgetID == idWidget) {
                    this.globalFunctionService.printToConsole(
                        this.constructor.name,'widgetDeleteIt', 'Deleting Widget ID ' + idWidget + ' ...')
                    this.widgets.splice(i, 1);
            this.deleteMode = false;
                }
            }
        }
    }

    editWidget (idWidget: number) {
        // Show the Widget Editor
        this.globalFunctionService.printToConsole(this.constructor.name,'editWidget', '@Start');

        // Respect the Lock
        if (this.widgets.filter(
            widget => widget.properties.widgetID ===
                idWidget)[0].properties.widgetIsLocked) {
                this.globalVariableService.growlGlobalMessage.next({
                    severity: 'info',
                    summary:  'Locked',
                    detail:   'First unlock the Widget by clicking on lock, then edit'
                });
                return;
        }

        // Set the environment for Edit: current widget + mode
        this.displayEditWidget = true;
        this.widgetToEdit = this.widgets.filter(
            widget => widget.properties.widgetID === idWidget)[0] ;

        this.widgetIDtoEdit = idWidget;
        this.addEditModeWidgetEditor = 'Edit';
    }

    clickWidgetLockToggle(idWidget: number) {
        // Toggle widgetIsLocked on a Widget
        // TODO - when to DB, update on DB (of kors)
        this.globalFunctionService.printToConsole(this.constructor.name,'clickWidgetLockToggle', '@Start');

        for (var i = 0, len = this.widgets.length; i < len; i++) {
            if (this.widgets[i].properties.widgetID == idWidget) {
                this.widgets[i].properties.widgetIsLocked =
                    !this.widgets[i].properties.widgetIsLocked;
            }
        }
    }

    clickWidgetIsLiked(idWidget: number, isLikedNewState: boolean) {
        // Toggle IsLiked on a Widget
        // - idWidget is the clicked Widget
        // - isLikedNewState = new status to change into
        // TODO - when to DB, update properties.widgetLiked[j].widgetLikedUserName
        //        by adding user, or removing depending on likedness
        this.globalFunctionService.printToConsole(this.constructor.name,'clickWidgetIsLiked', '@Start');

        // Update DB
        let username: string = this.globalVariableService.canvasUser.getValue().username;
        this.eazlService.updateWidgetIsLiked(
                idWidget,
                username,
                isLikedNewState)

        // Update local
        for (var i = 0, len = this.widgets.length; i < len; i++) {
            if (this.widgets[i].properties.widgetID == idWidget) {
                this.widgets[i].properties.widgetIsLiked = isLikedNewState;
            }
        }
    }

    showWidgetMessages (idWidget: number, widgetName: string) {
        // Show the Messages popup that belongs to the selected Widget
        this.globalFunctionService.printToConsole(this.constructor.name,'showWidgetMessages', '@Start');

        this.selectedMessageWidgetID = idWidget;
        this.selectedWidgetName = "Messages for Widget " + widgetName;
        this.displayMessageManager = true;
    }

    onWidgetDistanceChange(property: string) {
        // Changes the distance between shift-selected widgets (horisontally and vertically)
        this.globalFunctionService.printToConsole(this.constructor.name,'onWidgetDistanceChange', '@Start');

        // Get n, number of distances.  If only 1, bail since we need multiple widgets to play
        let numberDistances = this.selectedWidgetIDs.length - 1;
        if (numberDistances <= 1) {
            return
        }

        if (property == 'horisontalEquiDistant'         ||
            property == 'horisontalDecreaseDistance'    ||
            property == 'horisontalIncreaseDistance') {

            let selectedWidgetIDsWithLeft: {
                widgetID: number;
                widgetLeft: number;
            } [];

            // We use an Array sorted on .left, so that things move in one direction
            selectedWidgetIDsWithLeft = [];
            for (var i = 0; i < this.selectedWidgetIDs.length; i++) {

                let thisWidget: Widget = this.widgets.filter(
                    widget => widget.properties.widgetID === this.selectedWidgetIDs[i]
                )[0]

                selectedWidgetIDsWithLeft.push(
                    {
                        widgetID: thisWidget.properties.widgetID,
                        widgetLeft: thisWidget.container.left
                    }
                );
            }

            let selectedWidgetIDsLeftSorted = selectedWidgetIDsWithLeft.sort(
                function (a, b) {
                    return a.widgetLeft - b.widgetLeft;
            })

            // Calc total between distance between first and last horisontal center in px
            let firstWidgetID: number = selectedWidgetIDsLeftSorted[0].widgetID
            let lastWidgetID: number = selectedWidgetIDsLeftSorted[numberDistances].widgetID

            let firstWidget: Widget = this.widgets.filter(
                    widget => widget.properties.widgetID === firstWidgetID
                )[0];
            let lastWidget: Widget =  this.widgets.filter(
                    widget => widget.properties.widgetID === lastWidgetID
                )[0];

            let firstCenter: number = firstWidget.container.left +
                (firstWidget.container.width / 2);
            let lastCenter: number =  lastWidget.container.left +
                (lastWidget.container.width / 2);

            if (property == 'horisontalEquiDistant') {

                // Adjust centers of middle lot, not first or last ones
                for (var i = 1; i < numberDistances; i++) {

                    let thisWidgetID: number = selectedWidgetIDsLeftSorted[i].widgetID
                    let currentLeft: number = this.widgets.filter(
                        widget => widget.properties.widgetID === thisWidgetID
                    )[0].container.left;

                    let currentWidth: number = this.widgets.filter(
                        widget => widget.properties.widgetID === thisWidgetID
                    )[0].container.width;

                    // T = Total distance between first and last Centers
                    // S = Single distance between 2 centers = T / numberDistances
                    // C = new Center of internal Widget (first and last stays static)
                    //   = firstCenter + (i * S)
                    // L = new Left = C - ( currentWidth / 2)
                    let newLeft = firstCenter +
                        i * ( (lastCenter - firstCenter) / numberDistances ) -
                        (currentWidth / 2);

                    this.widgets.filter(
                        widget => widget.properties.widgetID === thisWidgetID
                    )[0].container.left = newLeft;

                    // Move the Container
                    this.childrenWidgetContainers.forEach((child) => {
                        if (child.nativeElement.id ==
                            thisWidgetID) {
                                this.renderer.setElementStyle(child.nativeElement,
                                    'left', newLeft.toString() + "px"
                                );
                        }
                    });
                }
            }

            if (property == 'horisontalDecreaseDistance') {

                // Subtract 3px to all lefts, except the first one
                for (var i = 1; i < (numberDistances + 1); i++) {

                    let thisWidgetID: number = selectedWidgetIDsLeftSorted[i].widgetID
                    let currentLeft: number = this.widgets.filter(
                        widget => widget.properties.widgetID === thisWidgetID
                    )[0].container.left;

                    // L = currentLeft + 3i (move 3px at a time)
                    let newLeft = currentLeft - (i * 3);

                    this.widgets.filter(
                        widget => widget.properties.widgetID === thisWidgetID
                    )[0].container.left = newLeft;

                    // Move the Container
                    this.childrenWidgetContainers.forEach((child) => {
                        if (child.nativeElement.id ==
                            thisWidgetID) {
                                this.renderer.setElementStyle(child.nativeElement,
                                    'left', newLeft.toString() + "px"
                                );
                        }
                    });
                }
            }

            if (property == 'horisontalIncreaseDistance') {

                // Add 3px to all lefts, except the first one
                for (var i = 1; i < (numberDistances + 1); i++) {

                    let thisWidgetID: number = selectedWidgetIDsLeftSorted[i].widgetID
                    let currentLeft: number = this.widgets.filter(
                        widget => widget.properties.widgetID === thisWidgetID
                    )[0].container.left;

                    // L = currentLeft + 3i (move 3px at a time)
                    let newLeft = currentLeft + (i * 3);

                    this.widgets.filter(
                        widget => widget.properties.widgetID === thisWidgetID
                    )[0].container.left = newLeft;

                    // Move the Container
                    this.childrenWidgetContainers.forEach((child) => {
                        if (child.nativeElement.id ==
                            thisWidgetID) {
                                this.renderer.setElementStyle(child.nativeElement,
                                    'left', newLeft.toString() + "px"
                                );
                        }
                    });
                }
            }
        }

        if (property == 'verticalEquiDistant'           ||
           property == 'verticalIncreaseDistance'       ||
           property == 'verticalDecreaseDistance') {
            let selectedWidgetIDsWithTop: {
                widgetID: number;
                widgetTop: number;
            } [];

            // We use an Array sorted on .top, so that things move in one direction
            selectedWidgetIDsWithTop = [];
            for (var i = 0; i < this.selectedWidgetIDs.length; i++) {

                let thisWidget: Widget = this.widgets.filter(
                    widget => widget.properties.widgetID === this.selectedWidgetIDs[i]
                )[0]

                selectedWidgetIDsWithTop.push(
                    {
                        widgetID: thisWidget.properties.widgetID,
                        widgetTop: thisWidget.container.top
                    }
                );
            }

            let selectedWidgetIDsTopSorted = selectedWidgetIDsWithTop.sort(
                function (a, b) {
                    return a.widgetTop - b.widgetTop;
            })

            // Calc total between distance between first and last vertical middle in px
            let firstWidgetID: number = selectedWidgetIDsTopSorted[0].widgetID
            let lastWidgetID: number = selectedWidgetIDsTopSorted[numberDistances].widgetID

            let firstWidget: Widget = this.widgets.filter(
                    widget => widget.properties.widgetID === firstWidgetID
                )[0];
            let lastWidget: Widget =  this.widgets.filter(
                    widget => widget.properties.widgetID === lastWidgetID
                )[0];

            let firstMiddle: number = firstWidget.container.top +
                (firstWidget.container.height / 2)
            let lastMiddle: number =  lastWidget.container.top +
                (lastWidget.container.height / 2)

            if (property == 'verticalEquiDistant') {

                // Adjust middles of middle lot, not first or last ones
                for (var i = 1; i < numberDistances; i++) {

                    let thisWidgetID: number = selectedWidgetIDsTopSorted[i].widgetID
                    let currentTop: number = this.widgets.filter(
                        widget => widget.properties.widgetID === thisWidgetID
                    )[0].container.top;

                    let currentHeight: number = this.widgets.filter(
                        widget => widget.properties.widgetID === thisWidgetID
                    )[0].container.height;

                    // T = Total distance between first and last Middles
                    // S = Single distance between 2 Middles = T / numberDistances
                    // C = new Middle of internal Widget (first and last stays static)
                    //   = firstMiddle + (i * S)
                    // L = new Top = C - ( currentHeight / 2)
                    let newTop = firstMiddle +
                        i * ( (lastMiddle - firstMiddle) / numberDistances ) -
                        (currentHeight / 2);

                    this.widgets.filter(
                        widget => widget.properties.widgetID === thisWidgetID
                    )[0].container.top = newTop;

                    // Move the Container
                    // Loop on the ViewChildren, and act for the Selected One
                    this.childrenWidgetContainers.forEach((child) => {
                        if (child.nativeElement.id ==
                            thisWidgetID) {
                                this.renderer.setElementStyle(child.nativeElement,
                                    'top', newTop.toString() + "px"
                                );
                        }
                    });
                }
            }
            if (property == 'verticalDecreaseDistance') {
                // Subtract 3px from middles except the first one
                for (var i = 1; i < (numberDistances + 1); i++) {

                    let thisWidgetID: number = selectedWidgetIDsTopSorted[i].widgetID
                    let currentTop: number = this.widgets.filter(
                        widget => widget.properties.widgetID === thisWidgetID
                    )[0].container.top;

                    // T = Top is moved with 3i (i times 3px)
                    let newTop = currentTop - (i * 3);

                    this.widgets.filter(
                        widget => widget.properties.widgetID === thisWidgetID
                    )[0].container.top = newTop;

                    // Move the Container
                    // Loop on the ViewChildren, and act for the Selected One
                    this.childrenWidgetContainers.forEach((child) => {
                        if (child.nativeElement.id ==
                            thisWidgetID) {
                                this.renderer.setElementStyle(child.nativeElement,
                                    'top', newTop.toString() + "px"
                                );
                        }
                    });
                }
            }
            if (property == 'verticalIncreaseDistance') {
                // Add 3px from middles except the first one
                for (var i = 1; i < (numberDistances + 1); i++) {

                    let thisWidgetID: number = selectedWidgetIDsTopSorted[i].widgetID
                    let currentTop: number = this.widgets.filter(
                        widget => widget.properties.widgetID === thisWidgetID
                    )[0].container.top;

                    // T = Top is moved with 3i (i times 3px)
                    let newTop = currentTop + (i * 3);

                    this.widgets.filter(
                        widget => widget.properties.widgetID === thisWidgetID
                    )[0].container.top = newTop;

                    // Move the Container
                    // Loop on the ViewChildren, and act for the Selected One
                    this.childrenWidgetContainers.forEach((child) => {
                        if (child.nativeElement.id ==
                            thisWidgetID) {
                                this.renderer.setElementStyle(child.nativeElement,
                                    'top', newTop.toString() + "px"
                                );
                        }
                    });
                }

            }
        }
    }

    onWidgetAlign(property: string) {
        // Aligns the shift-selected widgets to the left, according to the last one
        this.globalFunctionService.printToConsole(this.constructor.name,'onWidgetAlign', '@Start');

        // Nothing was selected
        if (this.selectedWidgetIDs.length == 0) {
            return;
        }

        // Get the 'property' of the last one
        let newValue: number = 0;
        let lastLeft: number = this.widgets.filter(
                widget => widget.properties.widgetID ===
                this.selectedWidgetIDs[this.selectedWidgetIDs.length - 1])[0].
                container.left;
        let lastWidth: number = this.widgets.filter(
            widget => widget.properties.widgetID ===
            this.selectedWidgetIDs[this.selectedWidgetIDs.length - 1])[0].
            container.width;
        let lastTop: number = this.widgets.filter(
            widget => widget.properties.widgetID ===
            this.selectedWidgetIDs[this.selectedWidgetIDs.length - 1])[0].
            container.top;
        let lastHeight: number = this.widgets.filter(
            widget => widget.properties.widgetID ===
            this.selectedWidgetIDs[this.selectedWidgetIDs.length - 1])[0].
            container.height;

        // Update spec, looping on the ViewChildren to find the shift-selected ones
        this.childrenWidgetContainers.toArray().forEach ((child) => {

            if (this.selectedWidgetIDs.indexOf(+child.nativeElement.id) >= 0) {

                // Get the properties of the current one, to do calcs
                let currentLeft: number = this.widgets.filter(
                        widget => widget.properties.widgetID ===
                            +child.nativeElement.id)[0].container.left;
                let currentWidth: number = this.widgets.filter(
                    widget => widget.properties.widgetID ===
                        +child.nativeElement.id)[0].container.width;
                let currentTop: number = this.widgets.filter(
                    widget => widget.properties.widgetID ===
                        +child.nativeElement.id)[0].container.top;
                let currentHeight: number = this.widgets.filter(
                    widget => widget.properties.widgetID ===
                        +child.nativeElement.id)[0].container.height;

                let attributeToChange: string = 'left';
                if (property == 'left') {
                    attributeToChange = 'left';
                    newValue = lastLeft;
                };
                if (property == 'center') {
                    attributeToChange = 'left';
                    newValue = lastLeft + (lastWidth / 2) - (currentWidth / 2);
                };
                if (property == 'right') {
                    attributeToChange = 'left';
                    newValue = lastLeft + lastWidth - currentWidth;
                };
                if (property == 'top') {
                    attributeToChange = 'top';
                    newValue = lastTop ;
                };
                if (property == 'middle') {
                    attributeToChange = 'top';
                    newValue = lastTop + (lastHeight / 2) - (currentHeight / 2);
                };
                if (property == 'bottom') {
                    attributeToChange = 'top';
                    newValue = lastTop + lastHeight - currentHeight;
                };

                if (property == 'sameWidth') {
                    attributeToChange = 'width';
                    newValue = lastWidth;
                };
                if (property == 'incrementWidth') {
                    attributeToChange = 'width';
                    newValue = currentWidth + this.gridSize;
                };
                if (property == 'decrementWidth') {
                    if (currentWidth > this.gridSize) {
                        attributeToChange = 'width';
                        newValue = currentWidth - this.gridSize;
                    }
                };
                if (property == 'sameHeight') {
                    attributeToChange = 'height';
                    newValue = lastHeight;
                };
                if (property == 'incrementHeight') {
                    attributeToChange = 'height';
                    newValue = currentHeight + this.gridSize;
                };
                if (property == 'decrementHeight') {
                    if (currentHeight > this.gridSize) {
                        attributeToChange = 'height';
                        newValue = currentHeight - this.gridSize;
                    }
                };

                // Update widget - we only set left or top
                if (attributeToChange == 'left') {
                    this.widgets.filter(
                        widget => widget.properties.widgetID ===
                            +child.nativeElement.id)[0].container.left = newValue;
                    }
                if (attributeToChange == 'top') {
                    this.widgets.filter(
                        widget => widget.properties.widgetID ===
                            +child.nativeElement.id)[0].container.top = newValue;
                    }

                if (attributeToChange == 'width') {
                    this.widgets.filter(
                        widget => widget.properties.widgetID ===
                            +child.nativeElement.id)[0].container.width = newValue;
                    }
                if (attributeToChange == 'height') {
                    this.widgets.filter(
                        widget => widget.properties.widgetID ===
                            +child.nativeElement.id)[0].container.height = newValue;
                    }

                // Change DOM
                this.changeElementRefProperty(
                    child,
                    attributeToChange,
                    newValue.toString()
                );

            }
        });
    }

    onWidgetMouseDown(event: MouseEvent, idWidget: number) {
        // When mouse (with or without shift) is pressed on a Widget
        this.globalFunctionService.printToConsole(this.constructor.name,'onWidgetMouseDown', '@Start');

        // Kill dragging
        this.widgetDraggingEnabled = false;

        // If Shift was hold down, add to Array of Widgets selected
        if (event.shiftKey) {

            // Add if new, remove if old
            if (this.selectedWidgetIDs.indexOf(idWidget) >= 0) {
                this.selectedWidgetIDs.splice(
                    this.selectedWidgetIDs.indexOf(idWidget),1
                );
            } else {
                this.selectedWidgetIDs.push(idWidget);
            }

            //  Just adding the shift-clicked once, and then we gone again
            return;
        }

        // Previously many shift-clicks -> now only this guy
        if (this.selectedWidgetIDs.length > 1) {
            this.selectedWidgetIDs = [];
            this.selectedWidgetIDs.push(idWidget);
            return;
        }

        if (this.selectedWidgetIDs.indexOf(idWidget) >= 0) {
            // This guys was only one selected -> now nothing
            this.selectedWidgetIDs = [];
        } else {
            // Only he is selected now
            this.selectedWidgetIDs = [];
            this.selectedWidgetIDs.push(idWidget);
        }
    }

    onWidgetKeyUp(event: MouseEvent,idWidget: number) {
        // TODO - the idea is to move the Widgets with the keyboard.  But I dont know
        // how to catch it on a Widget as it does not have focus ...
        // Works if click delete, and then move arrows (its above a widget then methinks)
        // KeyboardEvent {isTrusted: true, key: "ArrowRight", code: "ArrowRight", location: 0, ctrlKey: false, …}
        console.log(event)

    }

    addNewTab() {
        // Add a new tab to this Dashboard
        // TODO - set IDs properly when going to DB - this is error prone
        this.globalFunctionService.printToConsole(this.constructor.name,'addNewTab', '@Start');

        // Bail if nothing selected
        if (this.selectedDashboard == undefined) {
            this.globalVariableService.growlGlobalMessage.next({
                severity: 'warn',
                summary:  'No Dashboard selected',
                detail:   'First select a Dashboard'
            });

            return;
        }

        // Set Name
        this.numberUntitledTabs = this.numberUntitledDashboards + 1;
        let newdashboardTabName: string = 'Untitled - ' + this.numberUntitledTabs.toString();
        let maxID = this.dashboardTabs.length + 1;

        // Get current user
        let currentUser: string = this.globalFunctionService.currentUser();

        // Add
        let dashboardTabWorking: DashboardTab = {
                dashboardID: this.selectedDashboard.id,
                dashboardTabID: maxID,
                dashboardTabName: newdashboardTabName,
                dashboardTabDescription: 'Untitled',
                dashboardTabCreatedDateTime: this.canvasDate.now('standard'),
                dashboardTabCreatedUserName: currentUser,
                dashboardTabUpdatedDateTime: this.canvasDate.now('standard'),
                dashboardTabUpdatedUserName: currentUser
            };
        this.eazlService.addDashboardTab(dashboardTabWorking);

        // Refresh the Array of Dashboards IF no current filter
        this.dashboardTabsDropDown.push({
            label: newdashboardTabName,
            value: {
                id: this.selectedDashboard.id,
                name: newdashboardTabName
            }
        });
    }

    deleteTab() {
        // Delete selected Tab, provided its empty

        // Confirm if user really wants to delete
        // TODO - this guy needs Two clicks to close dialogue, but then deletes twice!!
        this.globalFunctionService.printToConsole(this.constructor.name,'deleteTab', '@Start');

        this.deleteMode = true;

        this.confirmationService.confirm({
            message: 'Are you sure that you want to delete this Tab?',
            accept: () => {
                this.TabDeleteIt();
                this.deleteMode = false;
            },
            reject: () => {
                this.deleteMode = false;
            }
        });
    }

    TabDeleteIt() {
        // Delete Dashboard button
        this.globalFunctionService.printToConsole(this.constructor.name,'TabDeleteIt', '@Start');

        // If something was selected, loop and find the right one
        if (this.selectedDashboardTab != undefined) {

            // Can only delete Widgetless Tabs
            if (this.widgets.filter( w => w.properties.dashboardTabID ==
                this.selectedDashboardTab.id).length >0) {
                    this.globalVariableService.growlGlobalMessage.next({
                        severity: 'warn',
                        summary:  'Tab NOT empty',
                        detail:   'A Tab can only be deleted if it has no Widgets: ' +
                                  this.selectedDashboardTab.name
                    });

            // Bail
            return;
            }

            // Delete
            this.eazlService.deleteDashboardTab(this.selectedDashboardTab.id);

            for (var i = 0; i < this.dashboardTabsDropDown.length; i++ ) {
                if (this.dashboardTabsDropDown[i].value.name == this.selectedDashboardTab.name) {
                    this.dashboardTabsDropDown.splice(i, 1);

                    break;
                }
            }
        }

        // Reset Delete Mode
        this.deleteMode = false;

    }

    detailTab() {
        // Show form with properties for the selected Tab
        this.globalFunctionService.printToConsole(this.constructor.name,'detailTab', '@Start');

        if (this.selectedDashboardTab != undefined) {
            this.displayTabDetails = true;
        } else {
            this.globalVariableService.growlGlobalMessage.next({
                severity: 'warn',
                summary:  'No Tab',
                detail:   'Please select a Tab from the dropdown, then click to see its detail'
            });

        }
    }

    onDashboardAdd() {
        // Add Dashboard button
        // TODO - set IDs properly when going to DB - this is error prone
        this.globalFunctionService.printToConsole(this.constructor.name,'onDashboardAdd', '@Start');

        // Get Max ID
        let maxID: number = -1;
        if (this.dashboards.length > 0) {
            maxID = this.dashboards[this.dashboards.length - 1].dashboardID;
        }

        // Get current user
        let currentUser: string = this.globalFunctionService.currentUser();

        // Add
        // TODO - do via DB RESTi
        this.numberUntitledDashboards = this.numberUntitledDashboards + 1;
        this.dashboards.push (
            {
                dashboardID: maxID + 1,
                dashboardCode: 'Untitled - ' + this.numberUntitledDashboards.toLocaleString(),
                dashboardName: '',
                dashboardDescription: 'This is a unique and special dashboard, like all others',
                dashboardPassword: 'StudeBaker',
                dashboardRefreshMode: 'Manual',
                dashboardRefreshFrequency: 0,
                dashboardOpenTabNr: 1,
                dashboardTabs: [],
                dashboardTags: [],
                dashboardComments: 'Comments for ' + this.numberUntitledDashboards.toString(),
                dashboardSystemMessage: '',
                dashboardIsLocked: false,
                isContainerHeaderDark: this.isContainerHeaderDark,
                showContainerHeader: this.showContainerHeader,
                dashboardBackgroundColor: '',
                dashboardBackgroundImageSrc: '',
                dashboardDefaultExportFileType: 'PowerPoint',
                dashboardPermissions: [],
                dashboardCreatedUserName: 'BenVdMark',
                dashboardCreatedDateTime: this.canvasDate.now('standard'),
                dashboardUpdatedUserName: currentUser,
                dashboardUpdatedDateTime: this.canvasDate.now('standard'),
                dashboardRefreshedUserName: '',
                dashboardRefreshedDateTime: '',
                dashboardUrl: '',
                dashboardIsLiked: false,
            }
        );

        // Refresh the Array of Dashboards IF no current filter
        if (!this.hasAdvancedFilter) {
            let emptyFilter: Filter = null;
            this.resetDashboardDropDowns(emptyFilter);
        }

        // Tell the user
        this.globalVariableService.growlGlobalMessage.next({
            severity: 'info',
            summary:  'Dashboard added',
            detail:   'A new, empty Dashboard has been added: ' + 'Untitled - ' +
                this.numberUntitledDashboards.toLocaleString()
        });
    }

    onWidgetResizeMouseDown(event, idWidget: number) {
        // Registers mouse position at mouse Dropdown
        // Just a note:  When the mouse is clicked, the sequence is:
        // 1. DragWidgetMouseDown
        // 2. ResizeMouseDown
        // Then 3 or 4
        // 3a. Drag Start
        // 3b. Drag End
        // 4.ResizeMouseUp

        this.globalFunctionService.printToConsole(this.constructor.name,'onWidgetResizeMouseDown', '@Start');

        // Leave if on move handle
        if (this.widgetDraggingEnabled) {
            return
        }

        this.containerStartX = event.x;
        this.containerStartY = event.y;
    }

    onWidgetResizeMouseUp(event, idWidget: number) {
        // After resizing, set width and height of widget
        this.globalFunctionService.printToConsole(this.constructor.name,'onWidgetResizeMouseUp', '@Start');

        // Leave if on move handle, or something bad
        if (this.widgetDraggingEnabled) {
            return
        }

        this.selectedWidget = this.widgets.filter(
            widget => widget.properties.widgetID === idWidget)[0] ;

        if (this.containerStartX != event.x  ||  this.containerStartY != event.y) {
            let endWith: number = this.selectedWidget.container.width + event.x -
                this.containerStartX;
            let endHeight: number = this.selectedWidget.container.height + event.y -
                this.containerStartY;

            // Left if bad stuff
            if (endWith == NaN  ||  endHeight == NaN) {
                return;
            }

            // Update the source data:
            //   There is no resize event, so it is difficult to know when the user
            //   was really, really resizing.  As a result, we cheat:
            //   - take the real Width & Height (from the DOM) and apply to the data.
            let realWidth = this.childrenWidgetContainers.filter(
                child  => child.nativeElement.id ==  idWidget)[0].
                    nativeElement.clientWidth;
            let realHeight = this.childrenWidgetContainers.filter(
                child  => child.nativeElement.id ==  idWidget)[0].
                    nativeElement.clientHeight;

            // TODO - consider if this should snap to the grid.  If so, remember to
            // render the Widget to the new dimensions
            this.widgets.filter(
                widget => widget.properties.widgetID === idWidget)[0].
                container.width = realWidth;
            this.widgets.filter(
                widget => widget.properties.widgetID === idWidget)[0].
                container.height = realHeight;
        }
    }

    onDragEndNewWidget(event) {
        // Create new widget - End of dragging BarChart
        this.globalFunctionService.printToConsole(this.constructor.name,'onDragEndNewWidget', '@Start');

        // Get the X,Y from the mouse, and adjust for snapping to grid IF applied
        this.widgetToEditX = event.x;
        this.widgetToEditY = event.y;

        this.widgetToEditX = this.globalFunctionService.alignToGripPoint(this.widgetToEditX);
        this.widgetToEditY = this.globalFunctionService.alignToGripPoint(this.widgetToEditY);

        this.widgetToEdit = this.eazlService.getDefaultWidgetConfig();
        this.addEditModeWidgetEditor = 'Add';
        this.displayEditWidget = true;
    }

    onWidgetDragHandleMouseDown(idWidget: number) {
        // Enables dragging
        this.globalFunctionService.printToConsole(this.constructor.name,'onWidgetDragHandleMouseDown', '@Start');

        // If nothing is selected, make this makker selected
        if (this.selectedWidgetIDs.length == 0) {
            this.selectedWidgetIDs.push(idWidget);
        }

        // If this Widget is not in the selection, bail
        if (this.selectedWidgetIDs.indexOf(idWidget) < 0) {
            return;
        }

        this.widgetDraggingEnabled = true;
    }

    onWidgetDragHandleMouseUp() {
        // Disables dragging
        this.globalFunctionService.printToConsole(this.constructor.name,'onWidgetDragHandleMouseUp', '@Start');

        this.widgetDraggingEnabled = false;
    }

    onWidgetDragStart(event: DragEvent, idWidget: number) {
        // Starting of Widget dragging - IF dragging is enabled
        this.globalFunctionService.printToConsole(this.constructor.name,'onWidgetDragStart', '@Start');

        // Store the Start X, Y
        this.widgetStartDragX = event.x;
        this.widgetStartDragY = event.y;
    }

    onWidgetDragEnd(event: DragEvent) {
        // Dragging of Widget has ended - IF enabled !!
        this.globalFunctionService.printToConsole(this.constructor.name,'onWidgetDragEnd', '@Start');

        // On allow dragging while on the handle
        if (!this.widgetDraggingEnabled) {
            return;
        }

        // Store the End X, Y
        this.widgetEndDragX = event.x;
        this.widgetEndDragY = event.y;

        // Calc raw (x,y) offset, and new new X, Y
        let offsetLeft = this.widgetEndDragX - this.widgetStartDragX;
        let offsetTop  = this.widgetEndDragY - this.widgetStartDragY;

        // Do the real moving
        this.moveWidgets(offsetLeft, offsetTop);
    }

    moveWidgets(offsetLeft: number, offsetTop: number) {
        // Actual movement of the selected Widgets - this is split off to make it easy
        // to implement movement via arrow keys
        this.globalFunctionService.printToConsole(this.constructor.name,'moveWidgets', '@Start');

        // Snap to grid
        offsetLeft = this.globalFunctionService.alignToGripPoint(offsetLeft);
        offsetTop = this.globalFunctionService.alignToGripPoint(offsetTop);

        let newLeft = 0;
        let newTop = 0;

        // Loop on the Array of selected IDs, and do things to it
        for (var i = 0; i < this.selectedWidgetIDs.length; i++) {
            // Get the Selected One
            this.selectedWidget = this.widgets.filter(
                widget => widget.properties.widgetID === this.selectedWidgetIDs[i])[0] ;
            let selectedElement = this.childrenWidgetContainers.filter(
                child  => child.nativeElement.id ==  this.selectedWidgetIDs[i].toString())[0]

            // Loop on the ViewChildren, and act for the Selected One
            if (selectedElement != undefined) {

                // Get new left + top, adjusted for grid-snapping if so desired
                newLeft = this.selectedWidget.container.left + offsetLeft;
                newTop = this.selectedWidget.container.top + offsetTop;

                newLeft = this.globalFunctionService.alignToGripPoint(newLeft);
                newTop = this.globalFunctionService.alignToGripPoint(newTop);

                // Move Widget Left
                this.renderer.setElementStyle(selectedElement.nativeElement,
                    'left', newLeft.toString() + "px"
                );

                // Update the Left data
                this.widgets.filter(
                    widget => widget.properties.widgetID ===
                        this.selectedWidgetIDs[i])[0].
                            container.left = newLeft;

                // Move Widget Top
                this.renderer.setElementStyle(selectedElement.nativeElement,
                    'top', newTop.toString() + "px"
                );


                // Update the Top data
                this.widgets.filter(
                    widget => widget.properties.widgetID ===
                        this.selectedWidgetIDs[i])[0].
                            container.top = newTop;
            }
        }

        // Dont do it again
        this.widgetDraggingEnabled = false;

    }

    bringWidgetToFront()  {
        // Bring the selected Widgets to the front via z-index
        this.globalFunctionService.printToConsole(this.constructor.name, 'bringWidgetToFront', '@Start');

        // Some validation
        if (this.selectedDashboard == null) {
            this.globalVariableService.growlGlobalMessage.next({
                severity: 'warn',
                summary:  'No selection',
                detail:   'Please select a Dashboard before editing properties'
            });
            return;
        }

        // Get Max z-Index
        let maxZindex: number = 0;
        maxZindex = this.eazlService.maxZindex(this.selectedDashboard.id);

        // Loop on selected ones
        for (var i = 0; i < this.selectedWidgetIDs.length; i++) {

            // Increment Max z-Index
            maxZindex = maxZindex + 1;

            // Loop on the ViewChildren, and act for the Selected One
            let selectedElement = this.childrenWidgetContainers.filter(
                child  => child.nativeElement.id ==  this.selectedWidgetIDs[i].toString())[0]

            if (selectedElement != undefined) {
                this.renderer.setElementStyle(selectedElement.nativeElement,
                    'z-index', maxZindex.toString()
                );

                // Update the data
                this.widgets.filter(
                    widget => widget.properties.widgetID ===
                        this.selectedWidgetIDs[i])[0].properties.widgetIndex = maxZindex;
            }

            // Refresh the Dashboard
            this.refreshDashboard = true;
        }
    }

    copyWidget() {
        // Copy (duplicate) selected Widgets
        this.globalFunctionService.printToConsole(this.constructor.name, 'copyWidget', '@Start');

        // Exit if nothing to do
        if (this.selectedWidgetIDs.length == 0) {
            return
        }

        // Loop on selected ones
        for (var i = 0; i < this.selectedWidgetIDs.length; i++) {

            // Make  a copy
            let widgetOriginal: Widget[] = this.widgets.filter(
                w => w.properties.widgetID == this.selectedWidgetIDs[i]);
            let widgetToCopy: Widget = JSON.parse(JSON.stringify(widgetOriginal[0]));

            // Minor adjustments
            widgetToCopy.properties.widgetName =
                widgetToCopy.properties.widgetName + ' (Copy)'
            widgetToCopy.container.widgetTitle =
                widgetToCopy.container.widgetTitle + ' (Copy)'
            widgetToCopy.container.left =
                widgetToCopy.container.left + (this.gridSize * 2);
            widgetToCopy.container.top =
                widgetToCopy.container.top + (this.gridSize * 2);

            // TODO - this is crude & error prone: do it properly in DB
            let lastWidgetID =
                this.widgets[this.widgets.length - 1].properties.widgetID;

            // Set the Widget ID & Add to Array
            // TODO - do via Eazl into DB
            widgetToCopy.properties.widgetID = lastWidgetID + 1;
            this.widgets.push(widgetToCopy);

            // Refresh the Dashboard
            this.refreshDashboard = true;
        }

        // Inform the user
        this.globalVariableService.growlGlobalMessage.next({
            severity: 'info',
            summary:  'Success',
            detail:   'Widgets copied'
        });
    }

    onSelectBackgroundColor(colorToChange: string) {
        // Set the sample background color
        this.globalFunctionService.printToConsole(this.constructor.name, 'onSelectBackgroundColor', '@Start');
        if (this.selectedBackgroundColor != undefined   &&  colorToChange == 'selectedBackgroundColor') {
            this.sampleColorWidgetBackgroundColor = this.selectedBackgroundColor.name;
        }
        if (this.selectedColor != undefined   &&  colorToChange == 'selectedColor') {
            this.sampleColorWidgetBackgroundColor = this.selectedColor.name;
        }

    }

    onClickExpandArea(areaToExpand: string) {
        // Expand the selected area in the widget palette, and close the rest
        this.globalFunctionService.printToConsole(this.constructor.name, 'onClickExpandArea', '@Start');

        // Reset all
        this.displayExpandBackgroundArea = false;
        this.displayExpandBorder = false;
        this.displayExpandBoxShadow = false;
        this.displayExpandColor = false;
        this.displayExpandFontSize = false;
        this.displayExpandGridSize = false;
        this.displayExpandDashboardSettings = false;

        if (areaToExpand == 'displayExpandBackgroundArea') {
            this.displayExpandBackgroundArea = true;
        }
        if (areaToExpand == 'displayExpandBorder') {
            this.displayExpandBorder = true;
        }
        if (areaToExpand == 'displayExpandBoxShadow') {
            this.displayExpandBoxShadow = true;
        }
        if (areaToExpand == 'displayExpandColor') {
            this.displayExpandColor = true;
        }
        if (areaToExpand == 'displayExpandFontSize') {
            this.displayExpandFontSize = true;
        }
        if (areaToExpand == 'displayExpandGridSize') {
            this.displayExpandGridSize = true;
        }
        if (areaToExpand == 'displayExpandDashboardSettings') {
            this.displayExpandDashboardSettings = true;
        }

    }

    onWidgetSelectAll() {
        // Select all the widgets
        this.globalFunctionService.printToConsole(this.constructor.name, 'onWidgetSelectAll', '@Start');

        // Some validation
        if (this.widgets == null) {
            this.globalVariableService.growlGlobalMessage.next({
                severity: 'warn',
                summary:  'No selection',
                detail:   'Please select a Dashboard before editing properties'
            });
            return;
        }

        // Kill and rebuild.  This destroys select-order, but for now I think it is okay ...
        this.selectedWidgetIDs = [];

        // Loop and build
        for (var i = 0; i < this.widgets.length; i++) {
                this.selectedWidgetIDs.push(this.widgets[i].properties.widgetID);
        }
    }

    onChangeLoadDashboardTabs(event) {
        // Called from HTML with ID to load
        this.globalFunctionService.printToConsole(this.constructor.name, 'onChangeLoadDashboardTabs', '@Start');

        // Remember this for next time
        this.globalVariableService.sessionLoadOnOpenDashboardID = this.selectedDashboard.id;
        this.globalVariableService.sessionLoadOnOpenDashboardName =
            this.dashboards.filter(dash =>
                dash.dashboardID == this.selectedDashboard.id)[0].dashboardName

        // Load the Tabs for this Dashboard
        this.loadDashboardTabsBody(this.selectedDashboard.id);

    }

    loadDashboardTabsBody(selectedDashboardID: number) {
        // Load the Tabs for the selected Dashboard
        this.globalFunctionService.printToConsole(this.constructor.name, 'loadDashboardTabsBody', '@Start');

        // Exit if null
        if (selectedDashboardID == null) {
            return;
        };

        // Get its Tabs in this Dashboard
        this.dashboardTabsDropDown = [];
        this.dashboardTabs = this.eazlService.getDashboardTabs(selectedDashboardID);

        // Fill the dropdown on the form
        for (var i = 0; i < this.dashboardTabs.length; i++) {
            this.dashboardTabsDropDown.push({
                label: this.dashboardTabs[i].dashboardTabName,
                value: {
                    id: this.dashboardTabs[i].dashboardTabID,
                    name: this.dashboardTabs[i].dashboardTabName
                }
            });
        }

        // Reset the list of selected Widgets, Widgets and refresh Dashboard area
        this.selectedWidgetIDs = [];
        this.widgets= [];
        this.refreshDashboard = true;

        this.isContainerHeaderDark = this.dashboards.filter(
            dash => dash.dashboardID == selectedDashboardID
        )[0].isContainerHeaderDark;
        this.showContainerHeader = this.dashboards.filter(
            dash => dash.dashboardID == selectedDashboardID
        )[0].showContainerHeader;

        let currentDashboardBackgroundColor: string = this.dashboards.filter(
            dash => dash.dashboardID == selectedDashboardID
        )[0].dashboardBackgroundColor;
        if (currentDashboardBackgroundColor != undefined) {
            this.selectedItemColor = {
                id: currentDashboardBackgroundColor,
                name: currentDashboardBackgroundColor,
                code: this.canvasColors.hexCodeOfColor(
                    currentDashboardBackgroundColor
                )
            }
            this.dashboardBackgroundColor = this.selectedItemColor;
        }

        // TODO - for now, many id = 1 records.  Either this does not matter at all, OR ...
        let currentdashboardBackgroundImageSrc: string = this.dashboards.filter(
            dash => dash.dashboardID == selectedDashboardID
        )[0].dashboardBackgroundImageSrc;
        if (currentdashboardBackgroundImageSrc != undefined) {
            this.selectedItem = {
                id: 1,
                name: currentdashboardBackgroundImageSrc
            }
            this.dashboardBackgroundImageSrc = this.selectedItem;
        }

        // Apply the Dashboard Settings
        this.applyDashboardSettings();

        // If a single tab, auto select it AFTER all other settings and work has been done
        if (this.dashboardTabsDropDown.length == 1) {
            this.selectedDashboardTab =
                {
                    id: this.dashboardTabsDropDown[0].value.id,
                    name: this.dashboardTabsDropDown[0].value.name
                }

            // Fill the Dashboard
            this.loadDashboard()
        } else {
            this.globalVariableService.growlGlobalMessage.next({
                severity: 'info',
                summary:  'Selection',
                detail:   'Select a tab from the Widget Editor to show'
            });
            this.selectedDashboardTab =
                {
                    id: -1,
                    name: ''
                }
        }
    }

    onclickContainerHeaderDark(){
        // Toggles the container buttons dark / light.  Then update array and DB
        this.globalFunctionService.printToConsole(this.constructor.name, 'onclickContainerHeaderDark', '@Start');

        // Some validation
        if (this.selectedDashboard == null) {
            this.globalVariableService.growlGlobalMessage.next({
                severity: 'warn',
                summary:  'No selection',
                detail:   'Please select a Dashboard before editing properties'
            });
            return;
        }

        // Update
        this.dashboards.filter(
            dash => dash.dashboardID == this.selectedDashboard.id
        )[0].isContainerHeaderDark = this.isContainerHeaderDark;
        this.eazlService.updateDashboardContainerHeader(
            this.selectedDashboard.id,
            this.isContainerHeaderDark
        );
    }

    onclickShowContainerHeader(){
        // Toggles the container header on / off.  Then update array and DB
        this.globalFunctionService.printToConsole(this.constructor.name, 'onclickShowContainerHeader', '@Start');

        // Some validation
        if (this.selectedDashboard == null) {
            this.globalVariableService.growlGlobalMessage.next({
                severity: 'warn',
                summary:  'No selection',
                detail:   'Please select a Dashboard before editing properties'
            });
            return;
        }

        this.showContainerHeader = !this.showContainerHeader;
        this.dashboards.filter(
            dash => dash.dashboardID == this.selectedDashboard.id
        )[0].showContainerHeader = this.showContainerHeader;
        this.eazlService.updateDashboardshowContainerHeader(
            this.selectedDashboard.id,
            this.showContainerHeader
        );
    }

    loadDashboard() {
        // Load the Widgets for the current DashboardID & TabName
        // - get Dashboard info from DB
        // - get Widgets for this Dashboard from DB
        // - show all the Widgets as per their properties
        this.globalFunctionService.printToConsole(this.constructor.name, 'loadDashboard', '@Start');

        // // Remember this for next time
        this.globalVariableService.sessionDashboardTabID = this.selectedDashboardTab.id;

        // Reset the list of selected Widgets
        this.selectedWidgetIDs = [];

        // Get its Widgets
        this.widgets = this.eazlService.getWidgetsForDashboard(
            this.selectedDashboard.id,
            this.selectedDashboardTab.name
        );

        // Set to review in ngAfterViewChecked
        this.refreshDashboard = true;
    }

    dashboardRefresh() {
        // Render the widgets according to their properties
        this.globalFunctionService.printToConsole(this.constructor.name,'dashboardRefresh', '@Start');

        // Loop on the Widgets, and get the data if it has a Graph or Table
        // Else, we assume no data has to be used for rendering
        // NOTE: we only store a report used once in this Array, even if used by >1 Widget
        for (var i = 0; i < this.widgets.length; i++) {
            let foundReport: boolean = false;
            if (this.widgets[i].areas.showWidgetGraph  ||
                this.widgets[i].areas.showWidgetTable)    {
                    for (var j = 0; j < this.reports.length; j++) {

                        if (this.widgets[i].properties.widgetReportID ==
                            this.reports[j].reportID) {
                                foundReport = true;
                            }
                        }
                    }
            
            let reportToAdd: Report = null;
            if (!foundReport  &&  this.widgets[i].properties.widgetReportID != -1) {
                reportToAdd = this.eazlService.getReport(
                    this.widgets[i].properties.widgetReportID
                );

                if (reportToAdd != null) {
                    this.reports.push(reportToAdd);
                }
            }
        }

        // Loop on the container ElementRefs, and set properties ala widget[].properties
        if (this.childrenWidgetContainers.toArray().length > 0) {
            for (var i = 0; i < this.widgets.length; i++) {
                
                // Get report data for this Widget
                this.widgets[i].properties.widgetReportID

                // Style attributes
                this.renderer.setElementStyle(this.childrenWidgetContainers.toArray()
                    [i].nativeElement,
                    'background-color', this.widgets[i].container.backgroundColor
                );
                if (this.widgets[i].container.border != '') {
                    this.renderer.setElementStyle(this.childrenWidgetContainers.toArray()
                        [i].nativeElement,
                        'border', this.widgets[i].container.border
                    );
                }
                if (this.widgets[i].container.boxShadow != '') {
                    this.renderer.setElementStyle(this.childrenWidgetContainers.toArray()
                        [i].nativeElement,
                        'box-shadow', this.widgets[i].container.boxShadow
                    );
                }
                this.renderer.setElementStyle(this.childrenWidgetContainers.toArray()
                    [i].nativeElement,
                    'color', this.widgets[i].container.color
                );
                this.renderer.setElementStyle(this.childrenWidgetContainers.toArray()
                    [i].nativeElement,
                    'font-size', this.widgets[i].container.fontSize.toString() + 'em'
                );
                this.renderer.setElementStyle(this.childrenWidgetContainers.toArray()
                    [i].nativeElement,
                    'height', this.widgets[i].container.height.toString() + 'px'
                );
                this.renderer.setElementStyle(this.childrenWidgetContainers.toArray()
                    [i].nativeElement,
                    'left', this.widgets[i].container.left.toString() + 'px'
                );
                this.renderer.setElementStyle(this.childrenWidgetContainers.toArray()
                    [i].nativeElement,
                    'top', this.widgets[i].container.top.toString() + 'px'
                );
                this.renderer.setElementStyle(this.childrenWidgetContainers.toArray()
                    [i].nativeElement,
                    'width', this.widgets[i].container.width.toString() + 'px'
                );

                // Other Attributes, like ID
                this.renderer.setElementAttribute(
                    this.childrenWidgetContainers.toArray()[i].nativeElement,
                    'id',
                    this.widgets[i].properties.widgetID.toString()
                );
            }
        }

        // Loop on the text ElementRefs, and set properties ala widget[].properties
        let textToDOM: string;
        if (this.childrenWidgetText.toArray().length > 0) {
            for (var i = 0; i < this.widgets.length; i++) {

                // Style attributes IF it has text (else *ngIf is buggered)
                if (this.widgets[i].areas.showWidgetText) {

                    // Other Attributes, like ID
                    this.renderer.setElementAttribute(
                        this.childrenWidgetText.toArray()[i].nativeElement,
                        'id',
                        this.widgets[i].properties.widgetID.toString()
                    );

                    // Modify and insert text
                    textToDOM = this.widgets[i].textual.textText

                    textToDOM = textToDOM.replace('##today##', this.canvasDate.today('standard'));
                    this.childrenWidgetText.toArray()[i].nativeElement.innerHTML = textToDOM

                    // Styling
                    this.renderer.setElementStyle(
                        this.childrenWidgetText.toArray()[i].nativeElement,
                        'background-color', this.widgets[i].textual.textBackgroundColor
                    );
                    this.renderer.setElementStyle(
                        this.childrenWidgetText.toArray()[i].nativeElement,
                        'border', this.widgets[i].textual.textBorder
                    );
                    this.renderer.setElementStyle(
                        this.childrenWidgetText.toArray()[i].nativeElement,
                        'color', this.widgets[i].textual.textColor
                    );
                    this.renderer.setElementStyle(
                        this.childrenWidgetText.toArray()[i].nativeElement,
                        'font-size', this.widgets[i].textual.textFontSize.toString() + 'em'
                    );
                    this.renderer.setElementStyle(
                        this.childrenWidgetText.toArray()[i].nativeElement,
                        'font-weight', this.widgets[i].textual.textFontWeight
                    );
                    this.renderer.setElementStyle(
                        this.childrenWidgetText.toArray()[i].nativeElement,
                        'height', this.widgets[i].textual.textHeight.toString() + 'px'
                    );
                    this.renderer.setElementStyle(
                        this.childrenWidgetText.toArray()[i].nativeElement,
                        'left', this.widgets[i].textual.textLeft.toString() + 'px'
                    );
                    this.renderer.setElementStyle(
                        this.childrenWidgetText.toArray()[i].nativeElement,
                        'margin', this.widgets[i].textual.textMargin
                    );
                    this.renderer.setElementStyle(
                        this.childrenWidgetText.toArray()[i].nativeElement,
                        'padding', this.widgets[i].textual.textPadding
                    );
                    this.renderer.setElementStyle(
                        this.childrenWidgetText.toArray()[i].nativeElement,
                        'position', this.widgets[i].textual.textPosition
                    );
                    this.renderer.setElementStyle(
                        this.childrenWidgetText.toArray()[i].nativeElement,
                        'text-align', this.widgets[i].textual.textTextAlign
                    );
                    this.renderer.setElementStyle(
                        this.childrenWidgetText.toArray()[i].nativeElement,
                        'top', this.widgets[i].textual.textTop.toString() + 'px'
                    );
                    if (this.widgets[i].textual.textWidth == 0) {
                        this.renderer.setElementStyle(
                            this.childrenWidgetText.toArray()[i].nativeElement,
                            'width',  Math.max(5, this.widgets[i].container.width - 10).toString() + 'px'
                        );
                    } else {
                        this.renderer.setElementStyle(
                            this.childrenWidgetText.toArray()[i].nativeElement,
                            'width',  this.widgets[i].textual.textWidth.toString() + 'px'
                        );
                    }
                }
            }
        }

        // Loop on the graph ElementRefs, and set properties ala widget[].properties
        if (this.childrenWidgets.toArray().length > 0) {
            for (var i = 0; i < this.widgets.length; i++) {
                if (this.widgets[i].areas.showWidgetGraph) {

                    // Other Attributes, like ID
                    this.renderer.setElementAttribute(
                        this.childrenWidgets.toArray()[i].nativeElement,
                        'id',
                        this.widgets[i].properties.widgetID.toString()
                    );

                    // Styling
                    this.renderer.setElementStyle(
                        this.childrenWidgets.toArray()[i].nativeElement,
                        'top', this.widgets[i].graph.graphTop.toString() + 'px'
                    );
                    
                    // Replace the data, if reportID != -1
                    if (this.widgets[i].properties.widgetReportID != -1) {

                        // 1. Obtain the data for the report linked to this Widget
                        let reportFields: string[] = ["Error", "reportID"];
                        let reportData: any[] = [
                            {
                                "Error": "No data found",
                                "reportID": this.widgets[i].properties.widgetReportID}
                        ];

                        for (var j = 0; j < this.reports.length; j++) {
                            if (this.widgets[i].properties.widgetReportID ==
                                this.reports[j].reportID) {

                                    for (var k = 0; k < this.reports.length; k++) {
                                        if (this.reports[j].reportFields[k] != null) {
                                            reportFields.push(
                                                this.reports[j].reportFields[k].name
                                        );
                                        }
                                    }
                                    reportData = this.reports[j].reportData;
                            }
                        }

                        // 2. Replace the data
                        this.widgets[i].graph.spec.data[0].values = reportData;
                    }

                    // Show the Graphs
                    var view = new vg.View(vg.parse( this.widgets[i].graph.spec ));
                    view.renderer('svg')
                        .initialize( this.childrenWidgets.toArray()[i].nativeElement)
                        .hover()
                        .run();
                }
            }
        }

        // Loop on the table ElementRefs, and set properties ala widget[].properties
        if (this.childrenWidgetTable.toArray().length > 0) {
            for (var i = 0; i < this.widgets.length; i++) {
                if (this.widgets[i].areas.showWidgetTable) {
                    
                    // Other Attributes, like ID
                    this.renderer.setElementAttribute(
                        this.childrenWidgetTable.toArray()[i].nativeElement,
                        'id',
                        this.widgets[i].properties.widgetID.toString()
                    );

                    // Obtain the data for the report linked to this Widget
                    let reportFields: string[] = ["Error", "reportID"];
                    let reportData: any[] = [
                        {
                            "Error": "No data found",
                            "reportID": this.widgets[i].properties.widgetReportID
                        }
                    ];

                    for (var j = 0; j < this.reports.length; j++) {
               
                        if (this.widgets[i].properties.widgetReportID ==
                            this.reports[j].reportID) {
                                for (var k = 0; k < this.reports.length; k++) {
                                    if (this.reports[j].reportFields[k] != null) {
                                        reportFields.push(
                                            this.reports[j].reportFields[k].name
                                        );
                                    }
                                // reportFields = this.reports[j].reportFields;
                                }
                                reportData = this.reports[j].reportData;
                        }
                    }

                    // Convert data to HTML table, and insert into DOM
                    textToDOM = this.convertArrayToTable(
                        reportFields,
                        reportData,
                        this.widgets[i].table.tableColor,
                        this.widgets[i].table.tableCols,
                        this.widgets[i].table.tableHeight,
                        this.widgets[i].table.tableHideHeader,
                        this.widgets[i].table.tableLeft,
                        this.widgets[i].table.tableRows,
                        this.widgets[i].table.tableTop,
                        this.widgets[i].table.tableWidth);
                    this.childrenWidgetTable.toArray()[i].nativeElement.innerHTML = textToDOM

                    // Styling
                    this.renderer.setElementStyle(
                        this.childrenWidgetTable.toArray()[i].nativeElement,
                        'height', this.widgets[i].table.tableHeight.toString() + 'px'
                    );
                    this.renderer.setElementStyle(
                        this.childrenWidgetTable.toArray()[i].nativeElement,
                        'left', this.widgets[i].table.tableLeft.toString() + 'px'
                    );
                    this.renderer.setElementStyle(
                        this.childrenWidgetTable.toArray()[i].nativeElement,
                        'top', this.widgets[i].table.tableTop.toString() + 'px'
                    );
                    this.renderer.setElementStyle(
                        this.childrenWidgetTable.toArray()[i].nativeElement,
                        'width', this.widgets[i].table.tableWidth.toString() + 'px'
                    );
                }
            }
        }

        // Loop on the images ElementRefs, and set properties ala widget[].properties
        if (this.childrenWidgetImage.toArray().length > 0) {
            for (var i = 0; i < this.widgets.length; i++) {
                if (this.widgets[i].areas.showWidgetImage) {
                    // Other Attributes, like ID
                    this.renderer.setElementAttribute(
                        this.childrenWidgetImage.toArray()[i].nativeElement,
                        'id',
                        this.widgets[i].properties.widgetID.toString()
                    );

                    // Styling
                    // NOTE: img tag height, src & width are set in html.
                    // I cant get it right here ...
                    this.renderer.setElementStyle(
                        this.childrenWidgetImage.toArray()[i].nativeElement,
                        'alt', this.widgets[i].image.imageAlt
                    );
                    this.renderer.setElementStyle(
                        this.childrenWidgetImage.toArray()[i].nativeElement,
                        'left', this.widgets[i].image.imageLeft.toString() + 'px'
                    );
                    this.renderer.setElementStyle(
                        this.childrenWidgetImage.toArray()[i].nativeElement,
                        'top', this.widgets[i].image.imageTop.toString() + 'px'
                    );
                    this.renderer.setElementStyle(
                        this.childrenWidgetImage.toArray()[i].nativeElement,
                        'z-index', '0'
                    );
                }
            }
        }
    }

    convertArrayToTable(
        reportFields: string[],
        reportData: any[],
        tableColor: string = '',
        tableCols: number = 0,
        tableHeight: number = 0,
        tableHideHeader: boolean = true,
        tableLeft: number = 0,
        tableRows: number = 0,
        tableTop: number = 0,
        tableWidth: number = 0
        ): string {
        // Converts an input array to a HTML string, which is a formatted table
        this.globalFunctionService.printToConsole(this.constructor.name,'convertArrayToTable', '@Start');

        // Table
        let tableHTML: string = '<div style="';

        // Add optional properties
        if (tableColor != '') {
            tableHTML = tableHTML + 'color: ' + tableColor + '; ';
        }
        if (tableHeight != 0) {
            tableHTML = tableHTML + 'height: ' + tableHeight + 'px; ';
            tableHTML = tableHTML + 'overflow: hidden; ';
        }
        if (tableLeft != 0) {
            tableHTML = tableHTML + 'left: ' + tableLeft + 'px; ';
        }
        if (tableTop != 0) {
            tableHTML = tableHTML + 'top: ' + tableTop + 'px; ';
        }
        if (tableWidth != 0) {
            tableHTML = tableHTML + 'width: ' + tableWidth + 'px; ';
            tableHTML = tableHTML + 'overflow: hidden; ';
        }

        // background-color:black;"> ';
        tableHTML = tableHTML + '"> ';
        tableHTML = tableHTML + "<table> "

        // Headers
        if (tableHideHeader) {
            let w: number = 0;
            tableHTML = tableHTML + "<tr> "
            for (var x in reportFields) {
                if (w >= tableCols  &&  tableCols > 0) {break;}
                w++
                tableHTML = tableHTML + "<th> " + reportFields[x] + "</th> "
            }
            tableHTML = tableHTML + "</tr> "
        }

        // Rows
        let z: number = 0;
        for (var i in reportData) {

            // Only do the nr of rows specified; 0 means all
            if (z >= tableRows  &&  tableRows > 0) {break;}
            z++;
            tableHTML = tableHTML + "<tr> ";

            // The reportData object returns more fields, so we need to restrict them
            // to the number of fields.  These values are given first in the for loop
            let y=0;
            for (var j in reportData[i]) {
                if (y < reportFields.length) {

                    // Only do the nr of cols specified; 0 means all
                    if (y >= tableCols  &&  tableCols > 0) {break;}
                    y++

                    tableHTML = tableHTML + "<td> "
                    tableHTML = tableHTML + reportData[i][j]
                    tableHTML = tableHTML + "</td> "
                }
            }
            tableHTML = tableHTML + "</tr> "
        }

        // Ending
        tableHTML = tableHTML + "</table>  </div>"

        // Return
         return tableHTML;
    }

    getDashboards() {
        // Get the dashboards from the DB
        this.globalFunctionService.printToConsole(this.constructor.name,'getDashboards', '@Start');

        // Set the list of Dashboards
        // TODO - get from RESTI
        this.dashboards = this.eazlService.getDashboards();

        // Make Dashboard Dropdown the same set
        let emptyFilter: Filter = null;
        this.resetDashboardDropDowns(emptyFilter);
     }

     resetDashboardDropDowns(inputFilter: Filter) {
        // Reset the Dashboard Dropdown list = Array of Dashboards
        this.globalFunctionService.printToConsole(this.constructor.name,'getDashboardDropDowns', '@Start');

        // Reset
        let recordPassesFilter: boolean;
        this.dashboardDropDown = [];
        for (var i = 0; i < this.dashboards.length; i++) {

            // Filter, IF we have specified something
            recordPassesFilter = true;
            if (inputFilter != null) {
                if (inputFilter.description != '') {
                    if (this.dashboards[i].dashboardDescription.toLocaleLowerCase().indexOf(inputFilter.description.toLocaleLowerCase())
                        == -1) {
                            recordPassesFilter = false
                    }
                }
            }

            // Fill the select items if it qualifies
            if (recordPassesFilter) {
                this.dashboardDropDown.push({
                    label: this.dashboards[i].dashboardCode,
                    value: {
                        id: this.dashboards[i].dashboardID,
                        name: this.dashboards[i].dashboardName
                    }
                });
            }
        }
    }

    resetTabsDropDown () {
        // Reset the tabs for the selected Dashboard
        // TODO - fix content, layout + when / where to call
        this.globalFunctionService.printToConsole(this.constructor.name,'resetTabsDropDown', '@Start');
        alert ('refresh tabs for sel. Dashboard');
    }

}

// Grid Layout Notes
// Just notes if we every decide to make a Grid layout (remember, think it through first,
// particularly how it will be editted afterwards) ....
// 1. get nr of cols as input, set to C
// 2. call function to Select All widgets
// 3. call function to sameWidth and sameHeight all widgets
// 4. set L, T of first widget - tricky as which one is best.  User decides?
// 5. calc r = number of rows: adjust for extras, so 15 widgets give 4 rows (r=0,1,2,3)
//         n = number of widgets, k = n // C (integer divide, so 15 // 4 = 3)
//         k: if n % C = 0 then r = r +1
// 6. Loop on r:
//         Loop on Wi (all widgets in row = r)
//                 i = [ (r + k) * ci)] + ci
//                 r = 0, 1 ... k (k = number of rows)
//                 ci = 0, 1 ... (C-1) (C is number of cols)
//                 say n=15, C = 4.  Then k = 4, r = 0,1,2,3
//                 First rows: [ (0 * 4) * 0] + 0 = 0,   [(0 * 4) * 0] + 1 = 1, etc
//             left = L * i (adjust horisontally in equal increments )
//             top = T * i  (all the same)
