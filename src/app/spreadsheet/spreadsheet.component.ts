import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from '../services/api.service';
import {ColDef, ColumnVisibleEvent, GridOptions} from 'ag-grid-community';
import {WorkflowRow} from '../models/workflow';
import {User} from '../models/user';
import {ImportData} from '../models/importdata';
import {forkJoin} from 'rxjs';
import {
  AGGridDatePickerCompponentComponent
} from '../components/aggrid-date-picker-compponent/aggrid-date-picker-compponent.component';
import {ToastrService} from 'ngx-toastr';

@Component({
  selector: 'app-spreadsheet',
  templateUrl: './spreadsheet.component.html',
  styleUrls: ['./spreadsheet.component.scss']
})
export class SpreadsheetComponent implements OnInit, OnDestroy {
  users = new Array<User>();
  gridOptions: GridOptions;
  isAdmin = localStorage['admin'] == "true";
  user = localStorage['user'];
  gridReady = false;
  panelOpenState = false;
  workflowItems = new Array<WorkflowRow>();
  totals = new WorkflowRow();
  importItems = new Array<ImportData>();
  searchTxt = '';
  dueIn45 = 0;
  updatedInLast45 = 0;
  updatedInLast60 = 0;
  notUpdatedInLast60 = 0;

  constructor(private api: ApiService, private toastr: ToastrService) {
    this.gridOptions = {};
  }

  ngOnInit(): void {
    forkJoin([
      this.api.getUsers(),
      this.api.getWorkflow()
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

  getColdefs(): ColDef[] {
    return this.gridOptions.columnDefs as ColDef[];
  }

  refreshColVisibility(col: ColDef, visibility: boolean | undefined) {
    this.gridOptions.columnApi?.setColumnVisible(col.field as string, visibility!);
  }

  days_between(date1: Date, date2: Date) {
    const ONE_DAY = 1000 * 60 * 60 * 24;
    const differenceMs = Math.abs(date1.getTime() - date2.getTime());
    return Math.round(differenceMs / ONE_DAY);

  }

  private calcExtData() {
    debugger;
    this.dueIn45 = 0;
    this.updatedInLast45 = 0;
    this.updatedInLast60 = 0;
    this.notUpdatedInLast60 = 0;
    const now = new Date();
    if (this.gridOptions.api?.isAnyFilterPresent()) {
      this.gridOptions.api?.forEachNodeAfterFilter(o => {
        const diff = this.days_between(now, new Date(o.data.LastUpdate));
        if (diff <= 45) {
          this.dueIn45++;
          this.updatedInLast45++;
        }
        if (diff <= 60) {
          this.updatedInLast60++;
        }
        if (diff > 60) {
          this.notUpdatedInLast60++;
        }
      });
    } else {
      this.importItems.forEach(o => {
        if (!o.LastUpdate) {
          o.LastUpdate = new Date();
        } else {
          o.LastUpdate = new Date(o.LastUpdate)
        }
        const diff = this.days_between(now, o.LastUpdate);
        if (diff <= 45) {
          this.dueIn45++;
          this.updatedInLast45++;
        }
        if (diff <= 60) {
          this.updatedInLast60++;
        }
        if (diff > 60) {
          this.notUpdatedInLast60++;
        }
      })
    }
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

    this.gridOptions.onFilterChanged = async () => {
      this.totals.ActiveListings = 0;
      this.gridOptions.api?.forEachNodeAfterFilter(o => {this.totals.ActiveListings! += o.data.ActiveListings!})
      this.gridOptions.api?.setPinnedTopRowData([this.totals]);
      this.calcExtData();
    }

    this.gridOptions.onColumnVisible = async (event: ColumnVisibleEvent) => {
      const col = event.column?.getColId();
      const coldefs = this.getColdefs();
      const coldef = coldefs.find(o => o.field === col);
      if (coldef) {
        coldef.hide = !event.visible;
      }
    }
    this.gridOptions.onGridReady = async () => {
      this.calcExtData();
      this.gridOptions.api?.setRowData(this.workflowItems);
      this.totals.ActiveListings = 0;
      this.workflowItems.forEach(o => {this.totals.ActiveListings! += o.ActiveListings!});
      this.gridOptions.api?.setPinnedTopRowData([this.totals]);
    };

    this.gridOptions.onCellEditingStopped = async (params: any) => {
      const tmp = params.data as WorkflowRow;
      const item = this.importItems.find(o => o.CompanyID === tmp.CompanyId);
      const col = params.column.colId;
      let archive = false;
      if (item) {
        if ((col === 'Completed45' || col === 'Completed60') && params.newValue) {
          archive = true;
          tmp.LastUpdate = new Date();
          item.LastUpdate = new Date();
          this.gridOptions.api?.refreshCells();
          this.toastr.info('Item will be archived in 5 seconds...');
        }
        item.CompanyID = tmp.CompanyId;
        item.Company = tmp.CompanyName;
// @ts-ignore
        item['Inventory Report URL'] = tmp.URL;
        item.Researcher = tmp.AssignedToId;
        item.Organization = tmp.Org;
        item.ActiveListings = tmp.ActiveListings;
        item.LastUpdate = tmp.LastUpdate;
        item.Sent45 = tmp.Sent45 ? tmp.Sent45 : false;
        item.Sent60 = tmp.Sent60 ? tmp.Sent60 : false;
        item.Completed45 = tmp.Completed45 ? tmp.Completed45 : false;
        item.Completed60 = tmp.Completed60 ? tmp.Completed60 : false;
        item.Notes = tmp.Notes;
        item.Brokers = tmp.Brokers;
        item.DesignatedContact = tmp.DesignatedContact;
        item.ContactEmail = tmp.ContactEmail;
        item.ContactPhone = tmp.ContactPhone;
        item.SpecialNotes = tmp.SpecialNotes;
        item.WatermarkAuditDate = tmp.WatermarkAuditDate;
        item.CopywriteContent = tmp.CopywriteContent;
        item.HasContentCert = tmp.HasContentCert ? tmp.HasContentCert : false;
        item.HasWebCert = tmp.HasWebCert ? tmp.HasWebCert : false;
        if (!archive) {
          this.api.saveWorkflow(item).subscribe(() => {
          }, err => {
            alert(err);
          });
        } else {
          setTimeout(() => {
            if (tmp.Completed45 || tmp.Completed60) {
              const copy = JSON.parse(JSON.stringify(item));
              item.LastUpdate = new Date();
              item.Sent60 = false;
              item.Sent45 = false;
              item.Completed45 = false;
              item.Completed60 = false;
              item.Notes = '';
              tmp.LastUpdate = new Date();
              tmp.Sent60 = false;
              tmp.Sent45 = false;
              tmp.Completed45 = false;
              tmp.Completed60 = false;
              tmp.Notes = '';
              forkJoin([
                this.api.saveWorkflow(item),
                this.api.archiveWorkflow(copy)
              ]).subscribe(() => {
                this.gridOptions.api?.refreshCells();
              }, err => {
                alert(err.error);
              })
            }
          }, 5000)
        }
      }
    }

    const self = this;
    const values = this.users.map(u => u.FirstName + ' ' + u.LastName)
    // @ts-ignore
    this.gridOptions.columnDefs = [
      {
        headerName: 'Researcher',
        field: 'Username',
        editable: this.isAdmin,
        resizable: true,
        hide: false,
        getQuickFilterText: function (params: any) {
          const row = params.data as WorkflowRow;
          const user = self.users.find(u => u.CognitoId === row.AssignedToId);
          return `${user?.FirstName} ${user?.LastName}`;
        },
        cellEditor: 'agSelectCellEditor',
        cellRenderer: function (data: any) {
          try {
            const row = data.data as WorkflowRow;
            const user = self.users.find(u => u.CognitoId === row.AssignedToId);
            if (user) {
              return `${user?.FirstName} ${user?.LastName}`;
            }
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
        editable: this.isAdmin,
        resizable: true,
        filter: 'agTextColumnFilter',
        hide: false
      },
      {
        headerName: 'Link',
        field: 'URL',
        editable: false,
        resizable: true,
        hide: false,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: any) => {
          return `<a href="${params.data.URL}" target="_blank">Link</a>`
        },
      },
      {
        headerName: 'Company Name',
        field: 'CompanyName',
        editable: this.isAdmin,
        resizable: true,
        hide: false,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Organization',
        field: 'Org',
        editable: this.isAdmin,
        resizable: true,
        hide: false,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Active Listings',
        field: 'ActiveListings',
        editable: this.isAdmin,
        resizable: true,
        hide: false,
        filter: 'agNumberColumnFilter',
      },
      {
        headerName: 'Date of Last Update',
        field: 'LastUpdate',
        resizable: true,
        hide: false,
        editable: this.isAdmin,
        filter: 'agDateColumnFilter',
        cellRenderer: AGGridDatePickerCompponentComponent,
        cellEditor: AGGridDatePickerCompponentComponent,
      },
      {
        headerName: '45 Day Target',
        field: 'Day45Target',
        editable: false,
        resizable: true,
        hide: false,
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
        editable: true,
        resizable: true,
        hide: false,
      },
      {
        headerName: 'Completed 45 Day',
        field: 'Completed45',
        editable: true,
        resizable: true,
        hide: false,
      },
      {
        headerName: '60 Day Target',
        field: 'Day60Target',
        editable: false,
        resizable: true,
        hide: false,
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
        editable: true,
        resizable: true,
        hide: false,
        filter: 'agNumberColumnFilter',
      },
      {
        headerName: 'Completed 60 Day',
        field: 'Completed60',
        editable: true,
        hide: false,
        filter: 'agNumberColumnFilter',
      },
      {
        headerName: 'Updating Notes',
        field: 'Notes',
        tooltipField: 'Notes',
        editable: true,
        resizable: true,
        hide: false,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Broker(s)',
        field: 'Brokers',
        editable: true,
        resizable: true,
        hide: false,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Designated Contact',
        field: 'DesignatedContact',
        editable: true,
        hide: false,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Contact Email',
        field: 'ContactEmail',
        editable: true,
        resizable: true,
        hide: false,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Contact Phone',
        field: 'ContactPhone',
        editable: true,
        resizable: true,
        hide: false,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Special Notes',
        field: 'SpecialNotes',
        tooltipField: 'SpecialNotes',
        editable: true,
        resizable: true,
        hide: false,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Watermark Audit Date',
        field: 'WatermarkAuditDate',
        editable: true,
        resizable: true,
        hide: false,
        cellRenderer: AGGridDatePickerCompponentComponent,
        cellEditor: AGGridDatePickerCompponentComponent,
      },
      {
        headerName: 'Copywrite Content',
        field: 'CopywriteContent',
        editable: true,
        hide: false,
        resizable: true,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Has Content Cert',
        field: 'HasContentCert',
        editable: true,
        resizable: true,
        hide: false,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Has Web Cert',
        field: 'HasWebCert',
        editable: true,
        resizable: true,
        hide: false,
        filter: 'agTextColumnFilter',
      }
    ];
  }
}
