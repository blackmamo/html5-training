import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { DepthActions } from './depth.service'
import {OrderActions} from './order.book.service';
import {OrderRequest} from 'bitcoin-common';
import {NgRedux} from '@angular-redux/store';
import {ActivatedRoute, ParamMap} from '@angular/router';

export enum TradeActions {
  SET_TRADER = "SetTraderId"
}

@Injectable()
export class TraderService {
  socket: io.Socket;
  constructor(private ngRedux: NgRedux<Object>) {}

  ngOnInit(){
    this.socket = io('http://localhost:8080', {reconnect: true});
  }

  submitOrder(newOrder: OrderRequest){
    this.socket.emit('newOrder', newOrder);
  }

  setTrader(trader: String){
    // clean up previous
    if (this.socket) {
      this.socket.destroy();
    }
    this.socket = io('http://localhost:8888', {reconnect: true});

    // logon
    this.socket.emit('setTraderId',{traderId: trader});
    this.ngRedux.dispatch({type: TradeActions.SET_TRADER, trader: trader});

    // get snapshots
    this.socket.once('DepthSnapshot', (depth: Object) => {
      this.ngRedux.dispatch({type: DepthActions.SNAPSHOT, snapshot: depth});
    });
    this.socket.once('OrderSnapshot', (orders: Object) => {
      this.ngRedux.dispatch({type: OrderActions.SNAPSHOT, snapshot: orders});
    });

    // listen to incrementals
    this.socket.on('DepthChanged', (update: Object) => {
      this.ngRedux.dispatch({type: DepthActions.CHANGED, change: update});
    });
    this.socket.on('DepthRemoved', (update: Object) => {
      this.ngRedux.dispatch({type: DepthActions.REMOVED, change: update});
    });

    // order updates
    this.socket.on('OrderStatus', (update: Object) => {
      this.ngRedux.dispatch({type: OrderActions.UPDATE, update: update});
    });
    this.socket.on('Fill', (fill: Object) => {
      this.ngRedux.dispatch({type: OrderActions.FILL, fill: fill});
    });
  }

  getTrader():string {
    return this.ngRedux.getState()['trader'].trader
  }
}
