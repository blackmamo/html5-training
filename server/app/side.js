// seems like the nearest thing to an enum
function Side(side) {
  this.side = side;
}
module.exports = Object.freeze({ Bid: new Side(0), Offer: new Side(1) });
