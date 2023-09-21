import { Component } from '@angular/core';
import {ICellEditorAngularComp, ICellRendererAngularComp} from 'ag-grid-angular';
import {GridApi, ICellRendererParams} from 'ag-grid-community';
import {WorkflowRow} from '../../models/workflow';
import {last} from 'rxjs';

@Component({
  selector: 'app-aggrid-date-picker-compponent',
  templateUrl: './aggrid-date-picker-compponent.component.html',
  styleUrls: ['./aggrid-date-picker-compponent.component.scss']
})
export class AGGridDatePickerCompponentComponent implements ICellRendererAngularComp, ICellEditorAngularComp{
  dateVal = new Date();
  row: WorkflowRow | undefined;
  api: GridApi | undefined;
  params: any;
  agInit(params: any): void {
    this.params = params;
    this.api = params.api;
    this.row = params.node.data;
    if (this.row) {
      // @ts-ignore
      this.dateVal = this.row[params.colDef.field] as Date || new Date();
      if (params.colDef.field === 'LastUpdate') {
        this.row.Day45Target = this.addDays(this.dateVal, 45);
        this.row.Day60Target = this.addDays(this.dateVal, 60);
      }
    }
  }

  addDays(date: Date, days: number) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  getValue(): any {
    if (this.params.colDef.field === 'LastUpdate') {
      this.row!.LastUpdate = this.dateVal;
      this.row!.Day45Target = this.addDays(this.dateVal, 45);
      this.row!.Day60Target = this.addDays(this.dateVal, 60);
    }

    this.api?.refreshCells()
    return this.dateVal;
  }

  protected readonly last = last;

  refresh(params: ICellRendererParams<any>): boolean {
    return false;
  }
}
