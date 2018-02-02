var Benchmark = require('benchmark');
var suite = new Benchmark.Suite('OrderBook');
var matcherBench = require('./matcherBenchmark')

module.exports = function(boundServerPort){
    // add tests
    suite.add(matcherBench(boundServerPort))
    // add listeners
    .on('cycle', function(event) {
        console.log(String(event.target));
    })
    // run async
    .run({ 'async': false});
}