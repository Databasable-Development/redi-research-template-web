import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from '../services/api.service';
import {Router} from '@angular/router';
import {UserAuthResponse} from '../models/user';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy{

  username: string = '';
  password: string = '';
  loginValid = true;
  constructor(private api: ApiService,
              private router: Router) {
  }
  ngOnInit(): void {
  }
  ngOnDestroy(): void {
  }

  resetPass() {
    this.router.navigate(['/forgotpass']);
  }
  onSubmit() {
    this.api.login(this.username, this.password)
      .subscribe((res: UserAuthResponse) => {
        localStorage['token'] = res.Token;
        localStorage['user'] = res.UserId;
        localStorage['admin'] = res.IsAdmin;
        this.router.navigate(['/spreadsheet']);
      }, err => {
        this.loginValid = false;
      })
  }
}
