// Dashboard
import { Component }                  from '@angular/core';
import { OnInit }                     from '@angular/core';
import { AfterViewInit }              from '@angular/core';
import { ViewEncapsulation }          from '@angular/core';
import { Directive }                  from '@angular/core';
import { ElementRef }                 from '@angular/core';
import { Renderer }                   from '@angular/core';
import { ViewChild }                  from '@angular/core';
import { ViewChildren }               from '@angular/core';
import { QueryList }                  from '@angular/core';

//  PrimeNG stuffies
import { ConfirmationService }        from 'primeng/primeng';
import { MenuItem }                   from 'primeng/primeng';  
import { SelectItem }                 from 'primeng/primeng';

// Our Services
import { EazlService }                from './eazl.service';
import { GlobalFunctionService }      from './global.function.service';
import { GlobalVariableService }      from './global.variable.service';

// Our models
import { Filter }                     from './model.filter';
import { CanvasColors }               from './data.chartcolors';
import { Dashboard }                  from './model.dashboards';
import { DashboardTab }               from './model.dashboardTabs';
import { Widget }                     from './model.widget';

// Vega stuffies
let vg = require('vega/index.js');

class DashboardSelectedItem {
    label: string;
    value: {
                id: number;
                code: string;
                name: string;
           }
}

class TheMan {
    id: number;
    code: string;
    name: string;
}

@Component({
    moduleId: module.id,
    selector: 'dashboardFINAL-component',
    templateUrl: 'dashboardFINAL.component.html',
    styleUrls: ['dashboardFINAL.component.css'],
})

export class DashboardFINALComponent implements OnInit, AfterViewInit {
    @ViewChildren('widgetContainter') childrenWidgetContainers: QueryList<ElementRef>;   // Attaches to # in DOM
    @ViewChildren('widget') childrenWidgets: QueryList<ElementRef>;             // Attaches to # in DOM

    // Current status of Dashboard
    refreshDashboard: boolean = false;
    displayAdvancedDashboardFilter: boolean = false;
    hasAdvancedFilter: boolean = false;
    chartWidth: number;
    radioLabelval1: number;
    checkedScale: number;

    // Currently selected stuffies
    selectedDashboardID: number;
    selectedDashboardName: any;
    selectedTabName: any;
    currentFilter: Filter;
    selectedWidget: Widget = null;          // Selected widget during dragging
    numberUntitledDashboards: number = 0;   // Suffix in naming new dashboards, Untitled + n
    selectedWidgetIDs: number[] = [];       // Array of WidgetIDs selected with mouse
    selectedCommentWidgetID: number;        // Current WidgetID for Comment

    // Currently selected properties for a Widget, in the Palette
    selectedBackgroundColor: string;
    selectedBorder: string;
    selectedBoxShadow: string;
    selectedColor: string;
    selectedContainerFontSize: number;      // In em

    // List of Dashboards read from DB
    dashboardDropDown: SelectItem[];
    dashboards: Dashboard[];

    // Tab stuffies, per Dashboard
    dashboardTabsDropDown:  SelectItem[];
    dashboardTabs: DashboardTab[];

    // Widget stuffies, per Dashboard
    widgets: Widget[];              // List of Widgets for a selected Dashboard
    widgetStartDragX: number;       // Start coordinates during dragging
    widgetStartDragY: number;       // Start coordinates during dragging
    widgetEndDragX: number;         // End coordinates during dragging
    widgetEndDragY: number;         // End coordinates during dragging
    containerStartX: number;        // X of widget at drag start
    containerStartY: number;        // Y of widget at drag start

    // Vars for Startup properties of a Widget
    chartColor: SelectItem[];       // Options for Backgroun-dColor DropDown
    borderOptions: SelectItem[];    // Options for Border DropDown
    boxShadowOptions: SelectItem[]; // Options for Box-Shadow DropDown
    snapToGrid: boolean = true;     // If true, snap widgets to gridSize
    gridSize: number;               // Size of grid blocks, ie 3px x 3px

    // True / False to show popup forms
    displayCommentsPopup:boolean = false;       // T/F to show Comments Popup form
    displayDashboardDetails: boolean = false;   // T/F to show Dashboard Details form
    displayEditWidget: boolean = false;         // T/F to show Widget Builder Popup form

    widgetDraggingEnabled: boolean = false;     // T/F to tell when we are in dragging mode


    constructor(
        private canvasColors: CanvasColors,
        private confirmationService: ConfirmationService,
        private eazlService: EazlService,
        private globalFunctionService: GlobalFunctionService,
        private globalVariableService: GlobalVariableService,
        private renderer : Renderer,
        private element : ElementRef
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
        this.borderOptions = [];
        this.borderOptions.push({label:'None',          value:{id:1, name: 'transparent',           code: ''}});
        this.borderOptions.push({label:'Thick Black',   value:{id:1, name: '3px solid black',       code: '3px solid black'}});
        this.borderOptions.push({label:'Thin Black',    value:{id:1, name: '1px solid black',       code: '1px solid black'}});
        this.borderOptions.push({label:'Thin White',    value:{id:1, name: '1px solid white',       code: '1px solid white'}});

        // BoxShadow Options
        this.boxShadowOptions = [];
        this.boxShadowOptions.push({label:'None',       value:{id:1, name: '',                      code: ''}});
        this.boxShadowOptions.push({label:'Black',      value:{id:1, name: '2px 2px 12px black',    code: '2px 2px 12px black'}});
        this.boxShadowOptions.push({label:'Gray',       value:{id:1, name: '2px 2px 12px gray',     code: '2px 2px 12px gray'}});
        this.boxShadowOptions.push({label:'White',      value:{id:1, name: '2px 2px 12px white',    code: '2px 2px 12px white'}});

        // Set startup stuffies
        // TODO: read from DB
        this.snapToGrid = true;
        this.gridSize = 30;

        // Get the list of dashboards from the DB
        this.getDashboards()
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

    public handleWidgetBuilderFormSubmit(success: boolean): void {
        // Is triggered after the Advanced Filter form is submitted
        this.globalFunctionService.printToConsole(this.constructor.name,'handleWidgetBuilderFormSubmit', '@Start');

        // Further actions ... ?
console.log('result is',success)
        // Close the popup form for the Widget Builder
        this.displayEditWidget = false;
    }


    handleChangeScale(event) {
        this.checkedScale = event.checked;

        // if (this.checkedScale) {showMonths = t}
console.log('handleChangeScale - State is: ' + this.checkedScale)
    }

    clickRadioButtonScale() {
console.log('clickRadioButtonScale - Selected: ' + this.radioLabelval1)
    }

    onOpenPaletteTab(event) {
        // Palette tab has been opened
console.log('onOpenPaletteTab')
    }

    onClosePaletteTab(event) {
console.log('onClosePaletteTab')
    }

    onChangeChartWidth(event) {
console.log('onChangeChartWidth')
    }

changeWidgetGraph() {
        // if (this.childrenWidgets.toArray().length > 0) {
        //     for (var i = 0; i < this.widgets.length; i++) {

        //         var view = new vg.View(vg.parse( this.widgets[i].graph.spec ));
        //         view.renderer('svg')
        //             .initialize( this.childrenWidgets.toArray()[i].nativeElement)
        //             .hover()
        //             .scheme('blues-9')
        //             .run();
        //     }
        // }
}

    clickContainerClear() {
        // Clears the all widget style selections
        this.globalFunctionService.printToConsole(this.constructor.name,'clickContainerClear', '@Start');

        this.selectedBackgroundColor = '';
        this.selectedBorder = '';
        this.selectedBoxShadow = '';
        this.selectedColor = '';
        this.selectedContainerFontSize = 1;
    }

    clickContainerApply(){
        // Apply the new values on the Palette -> Container tab to the selected Widget
        this.globalFunctionService.printToConsole(this.constructor.name,'clickContainerApply', '@Start');

        // Loop on the Array of selected IDs, and do things to TheMan
        for (var idWidget = 0; idWidget < this.selectedWidgetIDs.length; idWidget++) {

        // this.selectedWidget = this.widgets.filter(
        //     widget => widget.properties.widgetID === idWidget)[0] ;


            // this.childrenWidgetContainers.forEach((child) => {
            //     if (child.nativeElement.id == idWidget.toString()) {

            // Loop on the ViewChildren, and act for the Selected One
            let selectedElement = this.childrenWidgetContainers.filter(
                child  => child.nativeElement.id ==  this.selectedWidgetIDs[idWidget].toString())[0] 

            if (selectedElement != undefined) {

                // Background Color
                if (this.selectedBackgroundColor) {
                    this.renderer.setElementStyle(selectedElement.nativeElement,
                        'background-color', this.selectedBackgroundColor['name']
                    );

                    // Update the data
                    this.widgets.filter(
                        widget => widget.properties.widgetID === 
                            this.selectedWidgetIDs[idWidget])[0].
                                    container.backgroundColor = 
                                this.selectedBackgroundColor['name'];
                }

                // Border
                if (this.selectedBorder) {
                    this.renderer.setElementStyle(selectedElement.nativeElement,
                        'border', this.selectedBorder['name']
                    );

                    // Update the data
                    this.widgets.filter(
                        widget => widget.properties.widgetID === 
                            this.selectedWidgetIDs[idWidget])[0].
                                    container.border = 
                                this.selectedBorder['name'];
                }

                // BoxShadow
                if (this.selectedBoxShadow) {
                    this.renderer.setElementStyle(selectedElement.nativeElement,
                        'box-shadow', this.selectedBoxShadow['name']
                    );

                    // Update the data
                    this.widgets.filter(
                        widget => widget.properties.widgetID === 
                            this.selectedWidgetIDs[idWidget])[0].
                                    container.boxShadow = 
                                this.selectedBoxShadow['name'];
                }

                // Color
                if (this.selectedColor) {
                    this.renderer.setElementStyle(selectedElement.nativeElement,
                        'color', this.selectedColor['name']
                    );

                    // Update the data
                    this.widgets.filter(
                        widget => widget.properties.widgetID === 
                            this.selectedWidgetIDs[idWidget])[0].
                                    container.color = 
                                this.selectedColor['name'];
                }

                // Font Size
                if (this.selectedContainerFontSize) {
                    this.renderer.setElementStyle(selectedElement.nativeElement,
                        'font-size', this.selectedContainerFontSize.toString() + 'em'
                    );

                    // Update the data
                    this.widgets.filter(
                        widget => widget.properties.widgetID === 
                            this.selectedWidgetIDs[idWidget])[0].
                                    container.fontSize = 
                                this.selectedContainerFontSize['name'];
                }
            }
        }
    }

userMadeChanges() {
    // Indicate we were changing things
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

    changeElementRefProperty(elementRef: ElementRef,
        leftorRight: string,
        newValue:string) {
        // Update the property of a given ElementRef BOTH in the array and in the DOM
console.log ('chg el', leftorRight,newValue)
        // Update DOM
        if (leftorRight == 'left') {
            this.renderer.setElementStyle(elementRef.nativeElement,
                'left', newValue + "px"
            );
        }
        if (leftorRight == 'top') {
            this.renderer.setElementStyle(elementRef.nativeElement,
                'top', newValue + "px"
            );
        }

    }

    editWidgetComment (idWidget: number) {
        // Show the Comment popup window
        this.displayEditWidget = true;
    }

    showWidgetComment (idWidget: number) {
        // Show the Comment popup window
        let widgetComment: string = this.widgets.filter(
                    widget => widget.properties.widgetID === idWidget)[0].properties.widgetComments;
        this.selectedCommentWidgetID = idWidget;
        this.displayCommentsPopup = true;
    }

    onWidgetDistanceChange(property: string) {
        // Changes the distance between shift-selected widgets (horisontally and vertically)
        this.globalFunctionService.printToConsole(this.constructor.name,'onWidgetDistanceChange', '@Start');

        // Get n, number of distances.  If only 1, bail since we need multiple widgets to play
        let numberDistances = this.selectedWidgetIDs.length - 1;
        if (numberDistances <= 1) {
            return
        }

// console.log('here we go, property = ', property, ' #IDs = ',this.selectedWidgetIDs.length, 'numberDistances = ',numberDistances)
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
// console.log('selectedWidgetIDsLeftSorted', selectedWidgetIDsLeftSorted)

            // Calc total between distance between first and last horisontal center in px
            let firstWidgetID: number = selectedWidgetIDsLeftSorted[0].widgetID
            let lastWidgetID: number = selectedWidgetIDsLeftSorted[numberDistances].widgetID
// console.log('first/last IDs', firstWidgetID, lastWidgetID)

            let firstWidget: Widget = this.widgets.filter(
                    widget => widget.properties.widgetID === firstWidgetID
                )[0];
            let lastWidget: Widget =  this.widgets.filter(
                    widget => widget.properties.widgetID === lastWidgetID
                )[0];

            let firstCenter: number = firstWidget.container.left +
                (firstWidget.container.width / 2)
            let lastCenter: number =  lastWidget.container.left +
                (lastWidget.container.width / 2)
// console.log('first/last Centers', firstCenter, lastCenter)

            if (property == 'horisontalEquiDistant') {
            
                // Adjust centers of middle lot, not first or last ones
                for (var i = 1; i < numberDistances; i++) {

                    let thisWidgetID: number = selectedWidgetIDsLeftSorted[i].widgetID
                    let currentLeft: number = this.widgets.filter(
                        widget => widget.properties.widgetID === thisWidgetID
                    )[0].container.left;
    // console.log('2nd loop i = ', i,'ID=',thisWidgetID,'left',currentLeft,'move',( (lastCenter - firstCenter) / numberDistances ))

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

    // console.log('newLeft', newLeft, this.childrenWidgetContainers.toArray().length)                           

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
    // console.log('2nd loop i = ', i,'ID=',thisWidgetID,'left',currentLeft,'move',( (lastCenter - firstCenter) / numberDistances ))

                    // L = currentLeft + 3i (move 3px at a time)
                    let newLeft = currentLeft - (i * 3);

                    this.widgets.filter(
                        widget => widget.properties.widgetID === thisWidgetID
                    )[0].container.left = newLeft;

    // console.log('newLeft', newLeft, this.childrenWidgetContainers.toArray().length)                           

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
    // console.log('2nd loop i = ', i,'ID=',thisWidgetID,'left',currentLeft,'move',( (lastCenter - firstCenter) / numberDistances ))

                    // L = currentLeft + 3i (move 3px at a time)
                    let newLeft = currentLeft + (i * 3);

                    this.widgets.filter(
                        widget => widget.properties.widgetID === thisWidgetID
                    )[0].container.left = newLeft;

    // console.log('newLeft', newLeft, this.childrenWidgetContainers.toArray().length)                           

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
    // console.log('0',this.widgets[0].container.left)
    // console.log('1',this.widgets[1].container.left)
    // console.log('2',this.widgets[2].container.left)
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
// console.log('selectedWidgetIDsTopSorted', selectedWidgetIDsTopSorted)

            // Calc total between distance between first and last vertical middle in px
            let firstWidgetID: number = selectedWidgetIDsTopSorted[0].widgetID
            let lastWidgetID: number = selectedWidgetIDsTopSorted[numberDistances].widgetID
// console.log('first/last IDs', firstWidgetID, lastWidgetID)

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
// console.log('first/last Middles', firstMiddle, lastMiddle)
            if (property == 'verticalEquiDistant') { 
            
                // Adjust middles of middle lot, not first or last ones
                for (var i = 1; i < numberDistances; i++) {

                    let thisWidgetID: number = selectedWidgetIDsTopSorted[i].widgetID
                    let currentTop: number = this.widgets.filter(
                        widget => widget.properties.widgetID === thisWidgetID
                    )[0].container.top;
    // console.log('2nd loop i = ', i,'ID=',thisWidgetID,'Top',currentTop,'move',( (lastMiddle - firstMiddle) / numberDistances ))

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

    // console.log('newTop', newTop, this.childrenWidgetContainers.toArray().length)                           

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
    // console.log('2nd loop i = ', i,'ID=',thisWidgetID,'Top',currentTop,'move',( (lastMiddle - firstMiddle) / numberDistances ))


                    // T = Top is moved with 3i (i times 3px)
                    let newTop = currentTop - (i * 3);

                    this.widgets.filter(
                        widget => widget.properties.widgetID === thisWidgetID
                    )[0].container.top = newTop;

    // console.log('newTop', newTop, this.childrenWidgetContainers.toArray().length)                           

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
    // console.log('2nd loop i = ', i,'ID=',thisWidgetID,'Top',currentTop,'move',( (lastMiddle - firstMiddle) / numberDistances ))


                    // T = Top is moved with 3i (i times 3px)
                    let newTop = currentTop + (i * 3);

                    this.widgets.filter(
                        widget => widget.properties.widgetID === thisWidgetID
                    )[0].container.top = newTop;

    // console.log('newTop', newTop, this.childrenWidgetContainers.toArray().length)                           

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

    // console.log('0',this.widgets[0].container.top)
    // console.log('1',this.widgets[1].container.top)
    // console.log('2',this.widgets[2].container.top)

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

                let leftOrRight: string = 'left';

                if (property == 'left') { 
                    leftOrRight = 'left';
                    newValue = lastLeft;
                };
                if (property == 'center') { 
                    leftOrRight = 'left';
                    newValue = lastLeft + (lastWidth / 2) - (currentWidth / 2);
                };
                if (property == 'right') { 
                    leftOrRight = 'left';
                    newValue = lastLeft + lastWidth - currentWidth;
                };
                if (property == 'top') { 
                    leftOrRight = 'top';
                    newValue = lastTop 
                };
                if (property == 'middle') { 
                    leftOrRight = 'top';
                    newValue = lastTop + (lastHeight / 2) - (currentHeight / 2);
                };
                if (property == 'bottom') { 
                    leftOrRight = 'top';
                    newValue = lastTop + lastHeight - currentHeight;
                };

                // Update widget - we only set left or top
                if (leftOrRight == 'left') {
                    this.widgets.filter(
                        widget => widget.properties.widgetID === +child.nativeElement.id)[0].
                        container.left = newValue;
                    }
                if (leftOrRight == 'top') {
                    this.widgets.filter(
                        widget => widget.properties.widgetID === +child.nativeElement.id)[0].
                        container.top = newValue;
                    }

                // Change DOM
                this.changeElementRefProperty(
                    child, 
                    leftOrRight, 
                    newValue.toString()
                );

            }
        });
    }

    onWidgetMouseDown(event: MouseEvent,idWidget: number) {
        // When mouse (with or without shift) is pressed on a Widget
        this.globalFunctionService.printToConsole(this.constructor.name,'onWidgetMouseDown', '@Start');

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

    onDashboardDetail () {
        // Show detail about the selected Dashboard
        // TODO - design in detail, no duplications ...

        if (this.selectedDashboardName != undefined) {
            this.displayDashboardDetails = true;
        } else {
            this.globalVariableService.growlGlobalMessage.next({
                severity: 'warn', 
                summary:  'No Dashboard', 
                detail:   'Please select a Dashboard from the dropdown, then click to see its detail'
            });
            
        }
    }

    onDashboardDelete() {
        // Confirm if user really wants to delete
        // TODO - this guy needs Two clicks to close dialogue, but then deletes twice!!
        this.confirmationService.confirm({
            message: 'Are you sure that you want to delete this Dashboard?',
            accept: () => {
                this.DashboardDeleteIt();
            }
        });
    }

    DashboardDeleteIt() {
        // Delete Dashboard button
        this.globalFunctionService.printToConsole(this.constructor.name,'onDashboardDelete', '@Start');

        // Bring back the value field of the selected item.
        // TODO: could not get it via .value  Although this makes sense, see PrimeNG site,
        //       I had to make a workaround
        let TM: any = this.selectedDashboardName;

        // If something was selected, loop and find the right one
        if (this.selectedDashboardName != undefined) {
            // this.dashboards.splice(this.dashboards .indexOf(msg), 1);

            // Travers
            for (var i = 0; i < this.dashboards.length; i++ ) {
                if (this.dashboards[i].dashboardID - TM.id == 0) {
                    this.globalFunctionService.printToConsole(this.constructor.name,'onDashboardDelete', 'Deleting ' + TM.name + ' ...')
                    this.dashboards.splice(i, 1);
                    this.resetDashboardDropDowns(this.currentFilter);
                    break;
                }
            }
        }
    }

    onDashboardAdd() {
        // Add Dashboard button
        this.globalFunctionService.printToConsole(this.constructor.name,'onDashboardAdd', '@Start');

        this.numberUntitledDashboards = this.numberUntitledDashboards + 1;
        this.dashboards.push (
            {
                dashboardID: this.numberUntitledDashboards,
                dashboardCode: 'Untitled - ' + this.numberUntitledDashboards.toLocaleString(),
                dashboardName: '',

                dashboardBackgroundPicturePath: '',
                dashboardComments: 'Comments for ' + this.numberUntitledDashboards.toString(),
                dashboardCreatedDateTime: '2017/07/08',
                dashboardCreatedUserID: 'BenVdMark',
                dashboardDefaultExportFileType: 'PowerPoint',
                dashboardDescription: 'This is a unique and special dashboard, like all others',
                dashboardGroups: [
                    { dashboardGroupName: 'Favourites' },
                    { dashboardGroupName: 'Everyone'}
                ],
                dashboardIsLocked: false,
                dashboardLiked: [
                    { dashboardLikedUserID: 'AnnieA' },
                    { dashboardLikedUserID: 'BennieB' },
                    { dashboardLikedUserID: 'CharlesC' }
                ],
                dashboardOpenTabNr: 1,
                dashboardOwnerUserID: 'JohnH',
                dashboardPassword: 'StudeBaker',
                dashboardRefreshedDateTime: '',
                dashboardRefreshMode: 'Manual',
                dashboardSharedWith: [
                    {
                        dashboardSharedWithUserID: 'PeterP',
                        dashboardSharedWithType: 'Full'
                    }
                ],
                dashboardSystemMessage: '',
                dashboardUpdatedDateTime: '2017/07/08',
                dashboardUpdatedUserID: 'GordenJ'
            }
        );

        // Refresh the Array of Dashboards IF no current filter
        if (!this.hasAdvancedFilter) {
            let emptyFilter: Filter = null;
            this.resetDashboardDropDowns(emptyFilter);
        }
    }

    onWidgetResizeMouseDown(event, idWidget: number) {
        // Registers mouse position at mouse Dropdown

        // Leave if not on the resize handle
        if (!this.widgetDraggingEnabled) {
            return
        }

        this.containerStartX = event.x;
        this.containerStartY = event.y;
        // if (this.selectedWidget == null) {
        //             // Set the new, the latest Selected One
        //     this.selectedWidget = this.widgets.filter(
        //         widget => widget.properties.widgetID === idWidget)[0] ;
        // }
    }

    onWidgetResizeMouseUp(event, idWidget: number) {
        // After resizing, set width and height of widget

        // Leave if not on the resize handle
        if (!this.widgetDraggingEnabled) {
            return
        }

        this.selectedWidget = this.widgets.filter(
            widget => widget.properties.widgetID === idWidget)[0] ;
        
        if (this.containerStartX != event.x  ||  this.containerStartY != event.y) {
            let endWith: number = this.selectedWidget.container.width + event.x - 
                this.containerStartX;
            let endHeight: number = this.selectedWidget.container.height + event.y - 
                this.containerStartY;

            // Update the source data
            this.widgets.filter(
                widget => widget.properties.widgetID === idWidget)[0].
                container.width = endWith;        
            this.widgets.filter(
                widget => widget.properties.widgetID === idWidget)[0].
                container.height = endHeight;        

            // Update the Selected One
            this.selectedWidget.container.width = endWith;
            this.selectedWidget.container.height = endHeight;

            this.selectedWidget.graph.spec.width = endWith * 0.8; 
            this.selectedWidget.graph.spec.height = endHeight * 0.8; 

            this.changeWidgetGraph()

        }
    }

    onDragEndNewWidget(event) {
        // Create new widget - End of dragging BarChart
        this.globalFunctionService.printToConsole(this.constructor.name,'onDragEndNewWidget', '@Start');

        this.displayEditWidget = true;

// pass event.clientX + event.clientY
    }


    onWidgetDragHandleMouseDown() {
        // Enables dragging
        this.globalFunctionService.printToConsole(this.constructor.name,'onWidgetDragHandleMouseDown', '@Start');

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

        // // Set the Selected One
        // this.selectedWidget = this.widgets.filter(
        //     widget => widget.properties.widgetID === idWidget)[0] ;

        // Store the Start X, Y
        this.widgetStartDragX = event.x;
        this.widgetStartDragY = event.y;
    }

    onWidgetDragEnd(event: DragEvent,idWidget: number) {
        // Dragging of Widget has ended - IF enabled !!
        this.globalFunctionService.printToConsole(this.constructor.name,'onWidgetDragEnd', '@Start');

        // On allow dragging while on the handle
        if (!this.widgetDraggingEnabled) {
            return;
        }

        // Set the Selected One
        this.selectedWidget = this.widgets.filter(
            widget => widget.properties.widgetID === idWidget)[0] ;

        // Store the End X, Y
        this.widgetEndDragX = event.x;
        this.widgetEndDragY = event.y;

        // Calc new X, Y
        let newLeft = this.selectedWidget.container.left
            + this.widgetEndDragX - this.widgetStartDragX;
        let newTop  = this.selectedWidget.container.top
            + this.widgetEndDragY - this.widgetStartDragY;

        // Snap to grid if so desired
        if (this.snapToGrid) {
            if ( (newLeft % this.gridSize) >= (this.gridSize / 2)) {
                newLeft = newLeft + this.gridSize - (newLeft % this.gridSize)
            } else {
                newLeft = newLeft - (newLeft % this.gridSize)
            }
        }
            if ( (newTop % this.gridSize) >= (this.gridSize / 2)) {
                newTop = newTop + this.gridSize - (newTop % this.gridSize)
            } else {
                newTop = newTop - (newTop % this.gridSize)
            }
        
        this.selectedWidget.container.left = newLeft;
        this.selectedWidget.container.top  = newTop;

        // Update Widget Array
        // TODO - there must be a pure way to update Selected One & the Array.
        //      - and where does the good old DB fits in?
        this.widgets.filter(
            widget => widget.properties.widgetID === 
                this.selectedWidget.properties.widgetID)[0].
                    container.left = this.selectedWidget.container.left;
        this.widgets.filter(
            widget => widget.properties.widgetID === 
                this.selectedWidget.properties.widgetID)[0].
                    container.top = this.selectedWidget.container.top;
// alert ('selt one: ID = ' + this.selectedWidget.properties.widgetID.toString() + 
//     ', L= ' + this.selectedWidget.container.left.toString() + 
//     ', T = ' +this.selectedWidget.container.top.toString())
// alert ('1st widgets: ID = ' + this.widgets[0].properties.widgetID.toString() + 
//     ', L= ' + this.widgets[0].container.left.toString() + 
//     ', T = ' +this.widgets[0].container.top.toString())
// alert ('2nd widgets: ID = ' + this.widgets[1].properties.widgetID.toString() + 
//     ', L= ' + this.widgets[1].container.left.toString() + 
//     ', T = ' +this.widgets[1].container.top.toString())

        // Move the Container
        // Loop on the ViewChildren, and act for the Selected One
        this.childrenWidgetContainers.forEach((child) => {
            if (child.nativeElement.id ==
                this.selectedWidget.properties.widgetID) {
                    this.renderer.setElementStyle(child.nativeElement,
                        'left', (this.selectedWidget.container.left).toString() + "px"
                    );

                    this.renderer.setElementStyle(child.nativeElement,
                        'top', this.selectedWidget.container.top.toString() + "px"
                    );
            }
        });

        // Dont do it again
        this.widgetDraggingEnabled = false;

    }

    loadDashboardTabs(event) {
        // Load the Tabs for the selected Dashboard
        this.globalFunctionService.printToConsole(this.constructor.name, 'loadDashboard', '@Start');

        // Get its Tabs in this Dashboard
        this.dashboardTabsDropDown = [];
        this.selectedDashboardID = event.value.id;
        this.dashboardTabs = this.eazlService.getDashboardTabs(this.selectedDashboardID);

        // Fill the dropdown on the form
        for (var i = 0; i < this.dashboardTabs.length; i++) {
                this.dashboardTabsDropDown.push({
                    label: this.dashboardTabs[i].widgetTabName,
                    value: {
                        id: this.dashboardTabs[i].dashboardID,
                        name: this.dashboardTabs[i].widgetTabName
                    }
                });
        }
    }

    loadDashboard(event) {
        // Load the selected Dashboard for a given DashboardID & TabName
        // - get Dashboard info from DB
        // - get Widgets for this Dashboard from DB
        // - show all the Widgets as per their properties
        this.globalFunctionService.printToConsole(this.constructor.name, 'loadDashboard', '@Start');

        // Set the Selected One
        this.selectedDashboardID = event.value.id;
        this.selectedDashboardName = event.value.name;

        // Get its Widgets
        this.widgets = this.eazlService.getWidgetsForDashboard(
            this.selectedDashboardID, 
            this.selectedDashboardName
        );

        // Set to review in ngAfterViewChecked
        this.refreshDashboard = true;
    }


    dashboardRefresh() {
        // Render the widgets according to their properties
        this.globalFunctionService.printToConsole(this.constructor.name,'dashboardRefresh', '@Start');

        // Loop on the container ElementRefs, and set properties ala widget[].properties
        if (this.childrenWidgetContainers.toArray().length > 0) {
            for (var i = 0; i < this.widgets.length; i++) {

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

        // Loop on the children ElementRefs, and set properties ala widget[].properties
        if (this.childrenWidgets.toArray().length > 0) {
            for (var i = 0; i < this.widgets.length; i++) {

                // Other Attributes, like ID
                this.renderer.setElementAttribute(
                    this.childrenWidgets.toArray()[i].nativeElement,
                    'id',
                    this.widgets[i].properties.widgetID.toString()
                );

                // Show the Graphs
                // var view = new vg.View(vg.parse(spec));
                var view = new vg.View(vg.parse( this.widgets[i].graph.spec ));
                view.renderer('svg')
                    .initialize( this.childrenWidgets.toArray()[i].nativeElement)
                    .hover()
                    .run();
            }
        }
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
                if (inputFilter.owner != '') {
                    if (this.dashboards[i].dashboardOwnerUserID.toLocaleLowerCase().indexOf(inputFilter.owner.toLocaleLowerCase())
                        == -1) {
                            recordPassesFilter = false
                    }
                }
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
                        code: this.dashboards[i].dashboardCode,
                        name: this.dashboards[i].dashboardName
                    }
                });
            }
        }
    }

    resetTabsDropDown () {
        // Reset the tabs for the selected Dashboard
        // TODO - fix content, layout + when / where to call
        alert ('refresh tabs for sel. Dashboard')
    }

}