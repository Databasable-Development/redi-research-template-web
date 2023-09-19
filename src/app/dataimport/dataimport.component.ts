import {Component, OnDestroy, OnInit} from '@angular/core';
import {GridOptions} from 'ag-grid-community';
import {ImportData} from '../models/importdata';

@Component({
    selector: 'app-dataimport',
    templateUrl: './dataimport.component.html',
    styleUrls: ['./dataimport.component.scss']
})
export class DataimportComponent implements OnInit, OnDestroy {
    isAdmin = true;
    gridOptions: GridOptions;
    importRows = new Array<ImportData>();

    constructor() {
        this.gridOptions = {};
    }

    ngOnInit(): void {
        this.setGrid();
    }

    ngOnDestroy(): void {

    }
    csvToArray(str: string, delimiter = ",") {
        // slice from start of text to the first \n index
        // use split to create an array from string by delimiter
        const headers = str.slice(0, str.indexOf("\n")).split(delimiter);

        // slice from \n index + 1 to the end of the text
        // use split to create an array of each csv value row
        const rows = str.slice(str.indexOf("\n") + 1).split("\n");

        // Map the rows
        // split values from each row into an array
        // use headers.reduce to create an object
        // object properties derived from headers:values
        // the object passed as an element of the array
        const arr = rows.map(function (row) {
            const values = row.split(delimiter);
            const el = headers.reduce(function (object, header, index) {
                // @ts-ignore
                object[header] = values[index];
                return object;
            }, {});
            return el;
        });

        // return the array
        return arr;
    }


    onImportChange(e: any) {
        debugger;
        this.gridOptions.api?.setRowData([]);
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => {
            this.importRows = [];
            const csvData = reader.result!.toString();
            const rows = this.csvToArray(csvData);
            for (const r of rows) {
                const tmp = new ImportData();
                // @ts-ignore
                tmp.CompanyID = r['Company ID'] as string;
                // @ts-ignore
                tmp.Company = r['Company'] as string;
                // @ts-ignore
                tmp.Organization = r['Organization'] as string;
                // @ts-ignore
                tmp.ActiveListings = +r['Active Listings'];
                // @ts-ignore
                tmp.Researcher = r['Researcher'];

                this.importRows.push(tmp);
                this.gridOptions.api?.applyTransaction({add: [tmp]});
            }
        };
    }

    setGrid() {
        const self = this;
        this.gridOptions = {
            rowSelection: 'single',
            paginationPageSize: 500,
            context: {
                parentComponent: this
            },
            overlayNoRowsTemplate: `<span class="ag-overlay-loading-center">No rows to show</span>`,
        };

        this.gridOptions.onGridReady = async () => {
            this.gridOptions.api?.setRowData([]);
        };

        this.gridOptions.columnDefs = [
            {
                headerName: 'CompanyID',
                field: 'CompanyID',
                editable: false,
                filter: 'agTextColumnFilter',
            },
            {
                headerName: 'Organization',
                field: 'Organization',
                editable: false,
                filter: 'agTextColumnFilter',
            },
            {
                headerName: 'ActiveListings',
                field: 'ActiveListings',
                editable: false,
                filter: 'agTextColumnFilter',
            },
            {
                headerName: 'Researcher',
                field: 'Researcher',
                editable: false,
                filter: 'agTextColumnFilter',
            },
        ];
    }
}
