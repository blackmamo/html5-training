import * as R from 'ramda';
import {DepthChanged, DepthRemoved, DepthSnapshot, Level, Side} from '../../../common/dist';

export enum DepthActions {
  CHANGED = "DepthChanged",
  REMOVED = "DepthRemoved",
  SNAPSHOT = "DepthSnapshot"
}

export class DepthService {

  constructor() {}

  ngOnInit(){
  }

  static reducer(state = new DepthSnapshot([],[]), action) {
    switch (action.type) {
      case DepthActions.CHANGED:
        return R.set(DepthService.depthLens(action.change.side, action.change.price), action.change.qty, state);
      case DepthActions.REMOVED:
        return R.set(DepthService.depthLens(action.change.side, action.change.price), undefined, state);
      case DepthActions.SNAPSHOT:
        return action.snapshot;
      default:
        return state;
    }
  }

  private static depthLens <A,B>(side: Side, price: Number) {
    let comp =
      side === Side.Bid ?
        (a, b) => {
          return a >= b
        }:
        (a, b) => {
          return a <= b
        }
    let sideStr = side === Side.Bid ? 'bids' : 'offers';
    return R.compose(
      R.lensProp(sideStr),
      R.lens(
        R.find(R.propEq('price',price)),
        function(focus, target){
          let index = R.findLastIndex((level) => {
            return comp(level['price'], price)
          }, target);
          if (focus) {
            let newLevel = new Level(price, focus);
            if (target[index] && target[index]['price'] === price) {
              return R.update(index, newLevel, target);
            } else {
              return R.insert(index + 1, newLevel, target);
            }
          } else {
            return R.remove(index, 1, target);
          }
        }
      )
    )
  }

}
