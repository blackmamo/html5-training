import { Component } from '@angular/core';
import {NgRedux, select} from '@angular-redux/store';
import {Observable} from 'rxjs/Observable';
import {Side} from 'bitcoin-common';
import {ActivatedRoute, ParamMap} from '@angular/router';

@Component({
  selector: 'app-route',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private ngRedux: NgRedux<Object>,
              private route: ActivatedRoute){}

  trader$ = this.route.paramMap.map((map: ParamMap) => {
    return map.get('trader');
  });
}
