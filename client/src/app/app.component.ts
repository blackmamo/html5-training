import { Component } from '@angular/core';
import {NgRedux, select} from '@angular-redux/store';
import {Observable} from 'rxjs/Observable';
import {Side} from 'bitcoin-common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private ngRedux: NgRedux<Object>){}

  @select(['trader', 'trader']) trader$: Observable<String>;
}
