import {LoginComponent} from './login/login.component';
import {PreloadAllModules, RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {ForgotpassComponent} from './forgotpass/forgotpass.component';
import {SpreadsheetComponent} from './spreadsheet/spreadsheet.component';
import {DataimportComponent} from './dataimport/dataimport.component';
import {UsermanagementComponent} from './usermanagement/usermanagement.component';

const routes: Routes = [
  {path: '', redirectTo: '/login', pathMatch: 'full'},
  {path: 'login', component: LoginComponent},
  {path: 'forgotpass', component: ForgotpassComponent},
  {path: 'spreadsheet', component: SpreadsheetComponent},
  {path: 'dataimport', component: DataimportComponent},
  {path: 'usermanagement', component: UsermanagementComponent},
  // Add more routes as needed
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {preloadingStrategy: PreloadAllModules})
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {
}