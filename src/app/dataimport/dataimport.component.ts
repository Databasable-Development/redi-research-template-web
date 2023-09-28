import {Component, OnDestroy, OnInit} from '@angular/core';
import {GridOptions} from 'ag-grid-community';
import {ImportData} from '../models/importdata';
import {ApiService} from '../services/api.service';
import {User} from '../models/user';

@Component({
  selector: 'app-dataimport',
  templateUrl: './dataimport.component.html',
  styleUrls: ['./dataimport.component.scss']
})
export class DataimportComponent implements OnInit, OnDestroy {
  isAdmin = true;
  loading = false;
  gridOptions: GridOptions;
  importRows = new Array<ImportData>();
  manualRow = new ImportData();
  users = new Array<User>;
  gridReady = false;

  constructor(private api: ApiService) {
    this.gridOptions = {};
    this.api.getUsers()
      .subscribe(users => {
        this.users = users;
        this.setGrid();
        this.gridReady = true;
      });

    setTimeout(() => {

    }, 2000)
  }

  ngOnInit(): void {
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

        const keys = Object.keys(r);
        for (const k of keys) {
          // @ts-ignore
          tmp[k] = r[k];
        }

        this.importRows.push(tmp);
        this.gridOptions.api?.applyTransaction({add: [tmp]});
      }
    };
  }

  import() {
    if (this.manualRow.CompanyID) {
      this.manualRow.ActiveListings = +this.manualRow?.ActiveListings!.toString()
      this.importRows.push(this.manualRow);
    }


    this.loading = true;
    this.api.importData(this.importRows)
      .subscribe(() => {
        this.loading = false;
        this.gridOptions.api?.setRowData([]);
        this.importRows = [];
        this.manualRow = new ImportData();
        this.gridOptions.api?.setPinnedTopRowData([this.manualRow]);
      }, err => {
        alert(err.error);
        this.loading = false;
      })
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
      this.gridOptions.api?.setPinnedTopRowData([this.manualRow]);
    };

    const values = self.users.map(u => u.FirstName + ' ' + u.LastName)
    this.gridOptions.columnDefs = [
      {
        headerName: 'CompanyID',
        field: 'CompanyID',
        editable: true,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Organization',
        field: 'Organization',
        editable: true,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'ActiveListings',
        field: 'ActiveListings',
        editable: true,
        filter: 'agNumberColumnFilter',
      },
      {
        headerName: 'Researcher',
        field: 'Researcher',
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellRenderer: function (data: any) {
          try {
            const row = data.data as ImportData;
            const user = self.users.find(u => u.CognitoId === row.Researcher);
            return `${user?.FirstName} ${user?.LastName}`;
          } catch (err) {
            console.log(err);
          }

          return ``
        },

        valueSetter: function (params) {
          if (params && params.newValue.length > 0) {
            params.data.Researcher = self.users.find(o => {
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
    ];
  }
}
