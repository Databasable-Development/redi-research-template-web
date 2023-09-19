import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {ResetPassCode, ResetPassword, User, UserAuthResponse} from '../models/user';

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

  resetPassword(req: ResetPassword) {
    const jwt = localStorage['token'];
    return this.http.post(`${environment.url}/user/passreset`, req, {headers: {Authorization: `Bearer ${jwt}`}});
  }

  resetPassCode(req: ResetPassCode) {
    return this.http.post(`${environment.url}/user/passresetcode`, req);
  }
}
