export class User {
  FirstName: string | undefined;
  LastName: string | undefined;
  Email: string | undefined;
  Password: string | undefined;
  NewPassword: string | undefined;
  CognitoId: string | undefined;
  IsAdmin: number | undefined;
}

export class UserAuthResponse {
  Token: string | undefined;
  UserId: string | undefined;
  IsAdmin: boolean | undefined;
}

export class ResetPassword {
  Email: string | undefined;
}

export class ResetPassCode {
  Email: string | undefined;
  Code: string | undefined;
  Password: string | undefined;
}
