// Schema for the Report class

// Eazl
export class EazlReport {
    id: number;                         // Unique DB ID
    code: string;                       // Short Code
    name: string;                       // Name
    description: string;                // Long description
    package_id: number;                 // FK to DataSource
    package_permissions: [
        {
            package_permission: string;
        }
    ];
    specification: any;
    fields:
        [
        {
            name: string;
            alias: string;
            aggfunc: string;
            scalarfunc: string;
        }
        ]
    execute: string;
    permissions: [
        {
            permission: string;
        }
    ];
    checksum: string;                   // Checksum with query parameters (unique)
    version: string;                    // Version of query
    fetch: string;                      // To get resultset
    creator: string;                    // User who created record
    date_created: string;               // Date created
    editor: string;                     // User who made last change
    date_edited: string;                // Date last changed
    url: string;                        // RESTi url

}

// Canvas
export class Report {
    reportID: number;                   // Unique DB ID
    reportCode: string;                 // Code
    reportName: string;                 // Name
    reportDescription: string;          // Description
    // reportParameters: string;           // Parameters (optional)
    dataSourceID: number;               // FK to DataSource
    reportPackagePermissions: [
        {
            package_permission: string;
        }
    ];
    reportSpecification: any;
    reportFields:
        [
        {
            name: string;
            alias: string;
            aggfunc: string;
            scalarfunc: string;
        }
        ]
    reportFieldsString: string;         // Stringified list of fields
    reportExecute: string;
    reportPermissions: [
        {
            permission: string;
        }
    ];
    reportChecksum: string;             // Checksum with query parameters (unique)
    reportVersion: string;              // Version of query
    reportFetch: string;                // To get resultset
    reportCreatedUserName: string;      // UserName who created record
    reportCreatedDateTime: string;      // Date time of creation
    reportUpdatedUserName: string;      // UserName who created record
    reportUpdatedDateTime: string;      // Date time of creation
    reportUrl: string;                  // url for DRF
    reportData: any[];                  // Array (json) of data rows
}
