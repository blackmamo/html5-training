import { Component, OnInit } from '@angular/core';
import {TraderService} from '../trader.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {
  traders = ["Elliot", "Samantha", "Bernard"];

  constructor(private traderService: TraderService) { }

  ngOnInit() {
  }

  setTrader(target: HTMLInputElement){
    this.traderService.setTrader(target.value);
    target.blur();
  }

}
