import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgReduxModule, NgRedux } from '@angular-redux/store';
import { AppComponent } from './app.component';
import { NavigationComponent } from './navigation/navigation.component';
import { DepthViewComponent } from './depth-view/depth-view.component';
import { OrderViewComponent } from './order-view/order-view.component';
import { NewOrderComponent } from './new-order/new-order.component';
import {TraderService} from './trader.service';
import {DepthService} from './depth.service';
import {OrderBookService} from './order.book.service';
import {combineReducers} from 'redux';
import { TradeViewComponent } from './trade-view/trade-view.component';
import { DashPipe } from './dash.pipe';
import {MinValidDirective, SideValidatorDirective} from './side-validator.directive';
import {NewOrderService} from './new-order.service';
import {RouterModule} from '@angular/router';
import { RouteComponent } from './route/route.component';

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    DepthViewComponent,
    OrderViewComponent,
    NewOrderComponent,
    TradeViewComponent,
    DashPipe,
    SideValidatorDirective,
    MinValidDirective,
    RouteComponent
  ],
  imports: [
    BrowserModule,
    NgbModule.forRoot(),
    FormsModule,
    NgReduxModule,
    RouterModule.forRoot(
      [{path: '', component: AppComponent},{path: ':trader', component: AppComponent}],
      { enableTracing: true } // <-- debugging purposes only
    )
  ],
  providers: [TraderService, DepthService, OrderBookService, NewOrderService],
  bootstrap: [RouteComponent]
})
export class AppModule {
  constructor(ngRedux: NgRedux<Object>) {
    ngRedux.configureStore(
      combineReducers({
      depth: DepthService.reducer,
      orderBook: OrderBookService.reducer,
      newOrder: NewOrderService.reducer
    }),{});
  }
}
