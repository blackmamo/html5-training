import {Component, OnInit} from '@angular/core';
import { Side, OrderRequest} from 'bitcoin-common';
import {TraderService} from '../trader.service';
import {NgRedux, select} from '@angular-redux/store';
import {Observable} from 'rxjs/Observable';
import {NewOrderActions, NewOrderService} from '../new-order.service';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-new-order',
  templateUrl: './new-order.component.html',
  styleUrls: ['./new-order.component.scss'],
  host: {'(window:keydown)': 'keypress($event)'},
})
export class NewOrderComponent implements OnInit {
  sides = [Side[Side.Bid], Side[Side.Offer]];

  @select(['newOrder', 'side']) side$: Observable<Object>;
  @select(['newOrder', 'price']) price$: Observable<Object>;
  @select(['newOrder', 'qty']) qty$: Observable<Object>;

  constructor(
    private traderService: TraderService,
    private newOrderService: NewOrderService,
    private route: ActivatedRoute) {}

  ngOnInit() {
  }

  keypress(event){
    let mult = event.shiftKey ? 100 : 1;

    switch(event.key) {
      case "Space":
        this.newOrderService.setSide((this.newOrderService.getSide() === Side[Side.Bid]) ? Side[Side.Offer]: Side[Side.Bid]);
        break;
      case "ArrowUp":
        this.newOrderService.setPrice(this.newOrderService.getPrice() + (0.01 * mult));
        break;
      case "ArrowDown":
        this.newOrderService.setPrice(this.newOrderService.getPrice()  - (0.01 * mult));
        break;
      case "ArrowLeft":
        this.newOrderService.setQty(this.newOrderService.getQty()  + (1 * mult));
        break;
      case "ArrowRight":
        this.newOrderService.setQty(this.newOrderService.getQty() - (1 * mult));
        break;
      case "Enter":
        this.onSubmit();
        break;
      default:
        break;
    }
  }


  setQty(qty: number){
    this.newOrderService.setQty(qty);
  }

  setPrice(price: number){
    this.newOrderService.setPrice(price);
  }

  setSide(side: string){
    this.newOrderService.setSide(side);
  }

  onSubmit(){
    let trader = this.route.snapshot.paramMap.get('trader');
    let newOrder = this.newOrderService.getState();
    this.traderService.submitOrder(new OrderRequest(
      trader,
      Side[newOrder.side as string],
      newOrder.price,
      newOrder.qty));
  }
}
