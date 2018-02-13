const Sides = require("bitcoin-common").Side;

function objStr(obj) {
  let str = Object.prototype.toString.call(obj);
  return str;
}

module.exports = function(order) {
  let issues = [];
  if ("[object String]" !== objStr(order.trader)) {
    issues.push("Trader must be a string value");
  }
  if ("[object Number]" !== objStr(order.price) || isNaN(order.price)) {
    issues.push("Price must be a non NaN number");
  }
  if (
    "[object Number]" !== objStr(order.qty) ||
    isNaN(order.qty) ||
    order.qty % 1 !== 0 ||
    order.qty <= 0
  ) {
    issues.push("Qty must be a positive non NaN integer");
  }
  if (!(order.side === Sides.Bid || order.side === Sides.Offer)) {
    issues.push("Side must be Bid or Offer");
  }
  return issues;
};
