import { Component, OnInit } from '@angular/core';
import {TraderService} from '../trader.service';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {
  traders = ["Elliot", "Samantha", "Bernard"];

  constructor(private traderService: TraderService,
              private route: ActivatedRoute,
              private router: Router) { }

  ngOnInit() {
  }

  setTrader(target: HTMLInputElement){
    this.router.navigate(['./'+target.value],{
      queryParamsHandling: "merge"})
    this.traderService.setTrader(target.value);
    target.blur();
  }

  trader$ = this.route.paramMap.map((map: ParamMap) => {
    return map.get('trader');
  });
}
