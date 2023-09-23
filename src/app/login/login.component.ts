import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from '../services/api.service';
import {Router} from '@angular/router';
import {UserAuthResponse} from '../models/user';
import {load} from '@angular-devkit/build-angular/src/utils/server-rendering/esm-in-memory-file-loader';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy{

  username: string = '';
  password: string = '';
  loginValid = true;
  loading = false;
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
    this.loading = true;
    this.api.login(this.username, this.password)
      .subscribe((res: UserAuthResponse) => {
        this.loading = false;
        localStorage['token'] = res.Token;
        localStorage['user'] = res.UserId;
        localStorage['admin'] = res.IsAdmin;
        this.router.navigate(['/spreadsheet']);
      }, err => {
        this.loading = false;
        this.loginValid = false;
      })
  }

  protected readonly load = load;
}
