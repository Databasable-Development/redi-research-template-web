import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from '../services/api.service';
import {ResetPassCode, ResetPassword} from '../models/user';
import {Router} from '@angular/router';

@Component({
  selector: 'app-forgotpass',
  templateUrl: './forgotpass.component.html',
  styleUrls: ['./forgotpass.component.scss']
})
export class ForgotpassComponent implements OnInit, OnDestroy {
  requested = false;
  email: string = '';
  password: string = '';
  code: string = '';

  constructor(private apiService: ApiService,
              private router: Router) {

  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  onSubmit() {
    if (!this.requested) {
      const req = new ResetPassword();
      req.Email = this.email;
      this.apiService.resetPassword(req)
        .subscribe(() => {
          this.requested = true;
        }, err => {
          alert(err.error);
        });
      return;
    }

    const req = new ResetPassCode();
    req.Email = this.email;
    req.Password = this.password;
    req.Code = this.code;

    this.apiService.resetPassCode(req).subscribe((res) => {
      this.router.navigate(['/login']);
    }, err => {
      alert(err.error);
    })
  }
}
