import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {ResetPassCode, ResetPassword, User, UserAuthResponse} from '../models/user';
import {ImportData} from '../models/importdata';
import {WorkflowRow} from '../models/workflow';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) {
  }

  login(username: string, password: string) {
    return this.http.post<UserAuthResponse>(`${environment.url}/user/login`, {username, password});
  }

  createUser(user: User) {
    const jwt = localStorage['token'];
    return this.http.post<UserAuthResponse>(`${environment.url}/user`, user, {headers: {Authorization: `Bearer ${jwt}`}});
  }

  disableUser(user: User) {
    const jwt = localStorage['token'];
    return this.http.delete(`${environment.url}/user/${user.CognitoId}`, {headers: {Authorization: `Bearer ${jwt}`}});
  }

  getUsers() {
    const jwt = localStorage['token'];
    return this.http.get<User[]>(`${environment.url}/user`, {headers: {Authorization: `Bearer ${jwt}`}});
  }

  getWorkflow() {
    const jwt = localStorage['token'];
    return this.http.get<ImportData[]>(`${environment.url}/workflow`, {headers: {Authorization: `Bearer ${jwt}`}});
  }

  deleteWorkflow(wf: ImportData) {
    const jwt = localStorage['token'];
    return this.http.post(`${environment.url}/workflow/delete`, wf, {headers: {Authorization: `Bearer ${jwt}`}});
  }
  getArchivedWorkflow() {
    const jwt = localStorage['token'];
    return this.http.get<ImportData[]>(`${environment.url}/workflow/archive`, {headers: {Authorization: `Bearer ${jwt}`}});
  }

  saveWorkflow(importData: ImportData) {
    const jwt = localStorage['token'];
    return this.http.post(`${environment.url}/workflow`, importData, {headers: {Authorization: `Bearer ${jwt}`}});
  }

  archiveWorkflow(importData: ImportData) {
    const jwt = localStorage['token'];
    return this.http.post(`${environment.url}/workflow/archive`, importData, {headers: {Authorization: `Bearer ${jwt}`}});
  }

  resetPassword(req: ResetPassword) {
    const jwt = localStorage['token'];
    return this.http.post(`${environment.url}/user/passreset`, req, {headers: {Authorization: `Bearer ${jwt}`}});
  }

  resetPassCode(req: ResetPassCode) {
    return this.http.post(`${environment.url}/user/passresetcode`, req);
  }

  updateUser(req: User) {
    const jwt = localStorage['token'];
    return this.http.put(`${environment.url}/user/${req.CognitoId}`, req, {headers: {Authorization: `Bearer ${jwt}`}});
  }

  importData(data: ImportData[]) {
    const jwt = localStorage['token'];
    return this.http.post(`${environment.url}/import`, data, {headers: {Authorization: `Bearer ${jwt}`}});
  }
}
