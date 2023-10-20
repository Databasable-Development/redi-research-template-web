import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from '../services/api.service';
import {GridOptions} from 'ag-grid-community';
import {WorkflowRow} from '../models/workflow';
import {ImportData} from '../models/importdata';
import {forkJoin} from 'rxjs';
import {
  AGGridDatePickerCompponentComponent
} from '../components/aggrid-date-picker-compponent/aggrid-date-picker-compponent.component';
import {User} from '../models/user';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit, OnDestroy {
  gridOptions: GridOptions;
  users = new Array<User>();
  user = localStorage['user'];
  isAdmin = localStorage['admin'] == "true";
  gridReady = false;
  workflowItems = new Array<WorkflowRow>();
  importItems = new Array<ImportData>();
  searchTxt = '';

  constructor(private api: ApiService) {
    this.gridOptions = {};
  }

  ngOnInit(): void {
    forkJoin([
      this.api.getUsers(),
      this.api.getArchivedWorkflow()
    ])
      .subscribe(([users, workflow]) => {
        this.users = users;
        this.workflowItems = [];
        this.importItems = workflow;
        this.importItems.forEach(item => {
          if (!this.isAdmin && item.Researcher !== this.user) {
            return;
          }
          const tmp = new WorkflowRow();
          tmp.CompanyId = item.CompanyID;
          tmp.CompanyName = item.Company;
          // @ts-ignore
          tmp.URL = item['Inventory Report URL'];
          tmp.AssignedToId = item.Researcher;
          tmp.Org = item.Organization;
          tmp.ActiveListings = item.ActiveListings
          tmp.LastUpdate = item.LastUpdate;
          tmp.Sent45 = item.Sent45 ? item.Sent45 : false;
          tmp.Sent60 = item.Sent60 ? item.Sent60 : false;
          tmp.Completed45 = item.Completed45 ? item.Completed45 : false;
          tmp.Completed60 = item.Completed60 ? item.Completed60 : false;
          tmp.Notes = item.Notes;
          tmp.Brokers = item.Brokers;
          tmp.DesignatedContact = item.DesignatedContact;
          tmp.ContactEmail = item.ContactEmail;
          tmp.ContactPhone = item.ContactPhone;
          tmp.SpecialNotes = item.SpecialNotes;
          tmp.WatermarkAuditDate = item.WatermarkAuditDate;
          tmp.CopywriteContent = item.CopywriteContent;
          tmp.HasContentCert = item.HasContentCert ? item.HasContentCert : false;
          tmp.HasWebCert = item.HasWebCert ? item.HasWebCert : false;
          this.workflowItems.push(tmp);
        });
        this.setGrid();
        this.gridReady = true;
      }, err => {
        console.log(err);
      });
  }

  ngOnDestroy(): void {
  }

  search() {
    this.gridOptions.api?.setQuickFilter(this.searchTxt);
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
      this.gridOptions.api?.setRowData(this.workflowItems);
    };

    const self = this;
    const values = this.users.map(u => u.FirstName + ' ' + u.LastName)
    // @ts-ignore
    this.gridOptions.columnDefs = [
      {
        headerName: 'Researcher',
        field: 'Username',
        editable: false,
        cellEditor: 'agSelectCellEditor',
        getQuickFilterText: function(params: any) {
          const row = params.data as WorkflowRow;
          const user = self.users.find(u => u.CognitoId === row.AssignedToId);
          return `${user?.FirstName} ${user?.LastName}`;
        },
        cellRenderer: function (data: any) {
          try {
            const row = data.data as WorkflowRow;
            const user = self.users.find(u => u.CognitoId === row.AssignedToId);
            return `${user?.FirstName} ${user?.LastName}`;
          } catch (err) {
            console.log(err);
          }

          return ``
        },

        valueSetter: function (params) {
          if (params && params.newValue.length > 0) {
            params.data.AssignedToId = self.users.find(o => {
              const name = o.FirstName + ' ' + o.LastName;
              return name === params.newValue;
            })?.CognitoId;
          }
          return true;
        },

        valueGetter: function (params) {
          try {
            const user = self.users.find(refData => refData.CognitoId == params.data.Researcher);
            return `${user?.FirstName} ${user?.LastName}`;
          } catch (err) {
            console.log(err);
          }

          return ``;
        },
        cellEditorParams: {
          values: values,
          valueListGap: 0,
        }
      },
      {
        headerName: 'Company Id',
        field: 'CompanyId',
        editable: false,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Link',
        field: 'URL',
        editable: false,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: any) => {
          return `<a href="${params.data.URL}" target="_blank">Link</a>`
        },
      },
      {
        headerName: 'Company Name',
        field: 'CompanyName',
        editable: false,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Organization',
        field: 'Org',
        editable: false,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Active Listings',
        field: 'ActiveListings',
        editable: false,
        filter: 'agNumberColumnFilter',
      },
      {
        headerName: 'Date of Last Update',
        field: 'LastUpdate',
        editable: false,
        filter: 'agDateColumnFilter',
        cellRenderer: AGGridDatePickerCompponentComponent,
        cellEditor: AGGridDatePickerCompponentComponent,
      },
      {
        headerName: '45 Day Target',
        field: 'Day45Target',
        editable: false,
        filter: 'agDateColumnFilter',
        cellRenderer: (params: any) => {
          const row = params.data as WorkflowRow;
          if (row.Day45Target) {
            return row.Day45Target.toDateString()
          }

          return '';
        }
      },
      {
        headerName: 'Sent 45 Day',
        field: 'Sent45',
        editable: false,
      },
      {
        headerName: 'Completed 45 Day',
        field: 'Completed45',
        editable: false,
      },
      {
        headerName: '60 Day Target',
        field: 'Day60Target',
        editable: false,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: any) => {
          const row = params.data as WorkflowRow;
          if (row.Day60Target) {
            return row.Day60Target.toDateString()
          }

          return '';
        }
      },
      {
        headerName: 'Sent 60 Day',
        field: 'Sent60',
        editable: false,
        filter: 'agNumberColumnFilter',
      },
      {
        headerName: 'Completed 60 Day',
        field: 'Completed60',
        editable: false,
        filter: 'agNumberColumnFilter',
      },
      {
        headerName: 'Updating Notes',
        field: 'Notes',
        tooltipField: 'Notes',
        editable: false,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Broker(s)',
        field: 'Brokers',
        editable: false,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Designated Contact',
        field: 'DesignatedContact',
        editable: false,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Contact Email',
        field: 'ContactEmail',
        editable: false,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Contact Phone',
        field: 'ContactPhone',
        editable: false,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Special Notes',
        field: 'SpecialNotes',
        tooltipField: 'SpecialNotes',
        editable: false,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Watermark Audit Date',
        field: 'WatermarkAuditDate',
        editable: false,
        cellRenderer: AGGridDatePickerCompponentComponent,
        cellEditor: AGGridDatePickerCompponentComponent,
      },
      {
        headerName: 'Copywrite Content',
        field: 'CopywriteContent',
        editable: false,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Has Content Cert',
        field: 'HasContentCert',
        editable: false,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Has Web Cert',
        field: 'HasWebCert',
        editable: false,
        filter: 'agTextColumnFilter',
      }
    ];
  }
}
