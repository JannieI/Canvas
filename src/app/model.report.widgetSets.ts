// Schema for Report WidgetSet
export class ReportWidgetSet {
    reportID: number;                       // FK to model.report
    widgetSetID: number;                    // Unique DB ID
    widgetSetName: string;                  // Name
    widgetSetDescription: string;           // Description
    vegaSpec: any;                          // Vega spec (layout varies)
}