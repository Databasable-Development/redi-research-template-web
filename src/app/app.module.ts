import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {LoginComponent} from './login/login.component';
import {AppRoutingModule} from './app-routing.module';
import {MatCardModule} from '@angular/material/card';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {FormsModule} from '@angular/forms';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatMenuModule} from '@angular/material/menu';
import {MatIconModule} from '@angular/material/icon';
import {MatTableModule} from '@angular/material/table';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSelectModule} from '@angular/material/select';
import {MatNativeDateModule, MatOptionModule} from '@angular/material/core';
import {HttpClientModule} from '@angular/common/http';
import {ForgotpassComponent} from './forgotpass/forgotpass.component';
import {SpreadsheetComponent} from './spreadsheet/spreadsheet.component';
import {AgGridModule} from 'ag-grid-angular';
import {MatTabsModule} from '@angular/material/tabs';
import {DataimportComponent} from './dataimport/dataimport.component';
import {UsermanagementComponent} from './usermanagement/usermanagement.component';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {
  AGGridDatePickerCompponentComponent
} from './components/aggrid-date-picker-compponent/aggrid-date-picker-compponent.component';
import {ToastrModule} from 'ngx-toastr';
import { HistoryComponent } from './history/history.component';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatListModule} from '@angular/material/list';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ForgotpassComponent,
    SpreadsheetComponent,
    DataimportComponent,
    UsermanagementComponent,
    AGGridDatePickerCompponentComponent,
    HistoryComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    AgGridModule,
    HttpClientModule,
    MatToolbarModule,
    MatInputModule,
    MatCardModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatOptionModule,
    MatTabsModule,
    MatNativeDateModule,
    MatDatepickerModule,
    ToastrModule.forRoot(),
    MatExpansionModule,
    MatCheckboxModule,
    MatGridListModule,
    MatListModule,
    // ToastrModule added
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
