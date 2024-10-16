import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class KasaService {
  private kasaApiUrl = 'https://wap.tplinkcloud.com';
  private token: string = ''; // Token should be dynamically fetched
  private cloudUsername = 'hmmmckay@gmail.com';
  private cloudPassword = 'Sun84Mus';
  private deviceOneId = '8006A64843AFF7C73CEDB6A5E0C4B3A8227F0A41';
  private deviceTwoId = '8006565E452EACD2C78FD8A67A03B2432280B141';
  private deviceThreeId = '800616AC49755ACF446114F8C19728FB2280D5F8';
  constructor(private http: HttpClient) { }

  authenticateKasa( uuid: string): Observable<any> {
    const body = {
      method: 'login',
      params: {
        appType: 'Kasa_Android',
        cloudUserName: this.cloudUsername,
        cloudPassword: this.cloudPassword,
        terminalUUID: uuid,
      },
    };

    return this.http.post(this.kasaApiUrl, body).pipe(
      catchError(this.handleError),
      switchMap((response: any) => {
        this.token = response.result.token;
        return response;
      })
    );
  }

  getDeviceState(deviceId: string): Observable<any> {
    const body = {
      method: 'passthrough',
      params: {
        deviceId: deviceId,
        requestData: '{"system":{"get_sysinfo":null}}',
        token: this.token,
      },
    };

    return this.http.post(this.kasaApiUrl, body).pipe(
      catchError(this.handleError)
    );
  }

  controlDevice(deviceId: string, state: number): Observable<any> {
    const body = {
      method: 'passthrough',
      params: {
        deviceId: deviceId,
        requestData: `{"system":{"set_relay_state":{"state":${state}}}}`,
        token: this.token,
      },
    };

    return this.http.post(this.kasaApiUrl, body).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<any> {
    if (error.status !== 200) {
      console.error('Error occurred. Refreshing token.');
      return this.authenticateKasa( 'unique-device-id').pipe(
        switchMap(() => throwError(error)) // Retry the failed request
      );
    } else {
      return throwError(error); // Handle other errors as necessary
    }
  }
}
