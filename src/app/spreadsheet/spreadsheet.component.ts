import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
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
import {CookieService} from 'ngx-cookie-service';

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
  partialUpdatedVisible = 0;
  red = 0;
  yellow = 0;
  clear = 0;
  initialState: any;

  constructor(private api: ApiService,
              private toastr: ToastrService,
              private cookieService: CookieService) {
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
          tmp.Day45Target = this.addDays(tmp.LastUpdate!, 45);
          tmp.Day60Target = this.addDays(tmp.LastUpdate!, 60);
          tmp.WebsiteUpdate = item.WebsiteUpdate ? item.WebsiteUpdate : false;
          tmp.Sent45 = item.Sent45 ? item.Sent45 : false;
          tmp.PartialUpdate = item.PartialUpdate ? item.PartialUpdate : false;
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

  @HostListener('window:beforeunload')
  saveState() {
    const state = this.gridOptions.api?.getFilterModel();
    const colState = this.gridOptions.columnApi?.getColumnState();
    if (state) {
      const tmp = JSON.stringify(state);
      localStorage.setItem('filterState', tmp);
    }
    if (colState) {
      const tmp = JSON.stringify(colState);
      localStorage.setItem('columnState', tmp);
    }
  }

  search() {
    this.red = 0;
    this.yellow = 0;
    this.clear = 0;
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
    this.dueIn45 = 0;
    this.updatedInLast45 = 0;
    this.updatedInLast60 = 0;
    this.notUpdatedInLast60 = 0;
    this.partialUpdatedVisible = 0;
    const now = new Date();
    if (this.gridOptions.api?.isAnyFilterPresent()) {
      this.gridOptions.api?.forEachNodeAfterFilter(o => {
        const wf = o.data as WorkflowRow;
        if (wf.PartialUpdate) {
          this.partialUpdatedVisible++;
        }
        const diff60 = this.days_between(now, new Date(o.data.Day60Target));
        const lastUpdate = this.days_between(now, new Date(o.data.LastUpdate));
        if (diff60 <= 45) {
          this.dueIn45++;
        }

        if (lastUpdate <= 45) {
          this.updatedInLast45++;
        }
        if (lastUpdate <= 60) {
          this.updatedInLast60++;
        }
        if (lastUpdate > 60) {
          this.notUpdatedInLast60++;
        }
      });
    } else {
      this.importItems.forEach(o => {
        if (!this.isAdmin && o.Researcher !== this.user) {
          return;
        }

        if (!o.LastUpdate) {
          o.LastUpdate = new Date();
          this.api.saveWorkflow(o).subscribe(() => {
          });
        } else {
          o.LastUpdate = new Date(o.LastUpdate)
        }

        const target60 = this.addDays(o.LastUpdate, 60);
        const diff60 = this.days_between(now, new Date(target60));
        const lastUpdate = this.days_between(now, new Date(o.LastUpdate));

        if (lastUpdate > 60) {
          this.red++
        } else if (lastUpdate > 45) {
          this.yellow++
        } else {
          this.clear++;
        }

        if (diff60 <= 45) {
          this.dueIn45++;
          this.updatedInLast45++;
        }
        if (lastUpdate <= 45) {
          this.updatedInLast45++;
        }
        if (lastUpdate <= 60) {
          this.updatedInLast60++;
        }
        if (lastUpdate > 60) {
          this.notUpdatedInLast60++;
        }
      })
    }
  }

  reset() {
    localStorage.removeItem('filterState');
    localStorage.removeItem('columnState');

    this.gridOptions.api?.setFilterModel(this.initialState);
    // @ts-ignore
    this.gridOptions!.onGridReady();
    const columns = this.gridOptions.columnApi!.getAllColumns();
    // @ts-ignore
    for (const c of columns) {
      this.refreshColVisibility(c.getColDef(), true);
    }

    window.location.reload();
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
      this.partialUpdatedVisible = 0;
      this.totals.CompanyId = 'Totals'
      this.gridOptions.api?.forEachNodeAfterFilter(o => {
        this.totals.ActiveListings! += o.data.ActiveListings!
        if (o.data.PartialUpdate) {
          this.partialUpdatedVisible++;
        }
      })
      this.gridOptions.api?.setPinnedTopRowData([this.totals]);
      this.calcExtData();

      this.saveState();
    }

    this.gridOptions.onColumnVisible = async (event: ColumnVisibleEvent) => {
      const col = event.column?.getColId();
      const coldefs = this.getColdefs();
      const coldef = coldefs.find(o => o.field === col);
      if (coldef) {
        coldef.hide = !event.visible;
      }
    }

    this.gridOptions.getRowStyle = (params: any) => {
      if (params.node.rowIndex === 0 && params.data.CompanyId === 'Totals') {
        return {background: '#add8e6'};
      }

      return {background: ''}; // Default background
    }


    this.gridOptions.onGridReady = async () => {
      this.calcExtData();
      let index = 1;
      this.partialUpdatedVisible = 0;
      this.workflowItems.forEach(o => {
        o.id = index;
        index++;
        if (o.PartialUpdate) {
          this.partialUpdatedVisible++;
        }
        this.totals.ActiveListings! += o.ActiveListings!
      });

      this.gridOptions.api?.setRowData(this.workflowItems);
      this.totals.ActiveListings = 0;
      this.totals.CompanyId = 'Totals';

      this.gridOptions.api?.setPinnedTopRowData([this.totals]);

      const state = localStorage.getItem('filterState');
      const colState = localStorage.getItem('columnState');
      if (state) {
        const savedState = JSON.parse(state)
        this.initialState = this.gridOptions.api?.getFilterModel();
        this.gridOptions.api?.setFilterModel(savedState);
      }
      if (colState) {
        const savedState = JSON.parse(colState)
        for (const col of savedState) {
          const column = this.gridOptions.columnApi?.getColumn(col.colId);
          // @ts-ignore
          this.refreshColVisibility(column?.getColDef(), !col.hide);
        }
      }
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
        item.WebsiteUpdate = tmp.WebsiteUpdate ? tmp.WebsiteUpdate : false;
        item.Sent45 = tmp.Sent45 ? tmp.Sent45 : false;
        item.PartialUpdate = tmp.PartialUpdate ? tmp.PartialUpdate : false;
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
              item.WebsiteUpdate = false;
              item.Sent45 = false;
              item.PartialUpdate = false;
              item.Completed45 = false;
              item.Completed60 = false;
              item.Notes = '';
              tmp.LastUpdate = new Date();
              tmp.WebsiteUpdate = false;
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
        headerName: 'Id',
        field: 'id',
        resizable: true,
        filter: 'agNumberColumnFilter',
        hide: false
      },
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
          if (params.data.URL) {
            return `<a href="${params.data.URL}" target="_blank">Link</a>`
          } else {
            const row = params.data as WorkflowRow;
            return `<a href="https://rdma.catylist.com/company/${row.CompanyId}" target="_blank">Link</a>`
          }
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
        headerName: 'Website Update',
        field: 'WebsiteUpdate',
        editable: true,
        resizable: true,
        hide: false,
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
        editable: true,
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
        cellRenderer: (params: any) => {
          const date = new Date(params.value);
          const currentDate = new Date(); // Current date

          // Calculate the difference in days
          const differenceInDays = Math.floor((currentDate.getTime() - date.getTime()) / (1000 * 3600 * 24));


          if (differenceInDays > 60) {
            return `<span style="background-color: red; border-radius: 5px">${date.toDateString()}</span>`
          } else if (differenceInDays > 45) {
            return `<span style="background-color: yellow; border-radius: 5px">${date.toDateString()}</span>`
          }

          return `<span>${date.toDateString()}</span>`;

        },
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
        headerName: 'Partial Update',
        field: 'PartialUpdate',
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
        editable: true,
        cellEditorParams: {
          maxLength: 100000
        },
        cellEditor: 'agLargeTextCellEditor',
        cellEditorPopup: true,
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
        headerName: 'Copyright Content',
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

    if (this.isAdmin) {
      this.gridOptions.columnDefs.push({
        headerName: 'Actions',
        field: 'HasWebCert',
        editable: true,
        resizable: true,
        hide: false,
        cellRenderer: (params: any) => {
          const wf = params.data as WorkflowRow;
          const item = this.importItems.find(o => o.CompanyID === wf.CompanyId);
          const span = document.createElement('span');
          const deleteBtn = document.createElement('button');
          deleteBtn.innerHTML = 'Archive';
          deleteBtn.addEventListener('click', () => {
            this.api.deleteWorkflow(item!).subscribe(() => {
              let index = this.importItems.findIndex(o => o.CompanyID === item?.CompanyID);
              this.importItems.splice(index, 1);
              index = this.workflowItems.findIndex(o => o.CompanyId === wf.CompanyId);
              this.workflowItems.splice(index, 1);

              this.gridOptions.api?.applyTransaction({remove: [wf]});
            });
          });

          span.append(deleteBtn);
          return span;
        }
      })
    }
  }

  addDays(date: Date, days: number) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
