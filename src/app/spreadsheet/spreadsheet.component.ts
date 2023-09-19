import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from '../services/api.service';
import {Company} from '../models/company';
import {GridOptions} from 'ag-grid-community';
import {WorkflowRow} from '../models/workflow';

@Component({
  selector: 'app-spreadsheet',
  templateUrl: './spreadsheet.component.html',
  styleUrls: ['./spreadsheet.component.scss']
})
export class SpreadsheetComponent implements OnInit, OnDestroy {
  companies = new Array<Company>();
  gridOptions: GridOptions;
  // isAdmin = localStorage['admin'] as boolean;
  isAdmin = true;
  userId = localStorage['user'];

  constructor(private api: ApiService) {
    this.gridOptions = {};
  }

  ngOnInit(): void {
    this.setGrid();
  }

  ngOnDestroy(): void {
  }

  addDays(date: Date, days: number) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private async setGrid() {
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
        headerName: 'Company Id',
        field: 'CompanyId',
        editable: false,
        filter: 'agTextColumnFilter',
        checkboxSelection: true,
      },
      {
        headerName: 'Company Name',
        field: 'CompanyName',
        editable: false,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Assigned To',
        field: 'Username',
        editable: true,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Organization',
        field: 'Org',
        editable: true,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Active Listings',
        field: 'ActiveListings',
        editable: true,
        filter: 'agNumberColumnFilter',
      },
      {
        headerName: 'Date of Last Update',
        field: 'LastUpdate',
        editable: true,
        filter: 'agDateColumnFilter',
      },
      {
        headerName: '45 Day Target',
        field: 'Username',
        editable: false,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: any) => {
          debugger;
          const row = params.data as WorkflowRow;
          return this.addDays(row.LastUpdate!, 45);
        }
      },
      {
        headerName: 'Sent 45 Day',
        field: 'Sent45',
        editable: true,
        filter: 'agNumberColumnFilter',
      },
      {
        headerName: 'Completed 45 Day',
        field: 'Completed45',
        editable: true,
        filter: 'agNumberColumnFilter',
      },
      {
        headerName: '60 Day Target',
        field: 'Username',
        editable: false,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: any) => {
          debugger;
          const row = params.data as WorkflowRow;
          return this.addDays(row.LastUpdate!, 60);
        }
      },
      {
        headerName: 'Sent 60 Day',
        field: 'Sent60',
        editable: true,
        filter: 'agNumberColumnFilter',
      },
      {
        headerName: 'Completed 60 Day',
        field: 'Completed60',
        editable: true,
        filter: 'agNumberColumnFilter',
      },
      {
        headerName: 'Updating Notes',
        field: 'Notes',
        editable: true,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Broker(s)',
        field: 'Brokers',
        editable: true,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Designated Contact',
        field: 'DesignatedContact',
        editable: true,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Contact Email',
        field: 'ContactEmail',
        editable: true,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Contact Phone',
        field: 'ContactPhone',
        editable: true,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Special Notes',
        field: 'SpecialNotes',
        editable: true,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Watermark Audit Date',
        field: 'WatermarkAuditDate',
        editable: true,
        filter: 'agDateColumnFilter',
      },
      {
        headerName: 'Copywrite Content',
        field: 'CopywriteContent',
        editable: true,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Has Content Cert',
        field: 'HasContentCert',
        editable: true,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Has Web Cert',
        field: 'HasWebCert',
        editable: true,
        filter: 'agTextColumnFilter',
      }
    ];
  }
}
