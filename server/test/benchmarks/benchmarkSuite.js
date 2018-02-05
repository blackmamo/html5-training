var Benchmark = require('benchmark');
var suite = new Benchmark.Suite('OrderBook');
var matcherBench = require('./matcherBenchmark')
var matcherBatchedBench = require('./matcherBatchedBenchmark')
var matcherNoSocketBench = require('./matcherNoSocketBenchmark')
var socketRoundTripBenchmark = require('./socketRoundTripBenchmark')
var socketRoundTripNoConnectionBenchmark = require('./socketRoundTripNoConnectionBenchmark')
var twoSocketRoundTripNoConnectionBenchmark = require('./twoSocketRoundTripNoConnectionBenchmark')

module.exports = function(boundServerPort, done){
    // add tests
    suite.add(matcherNoSocketBench)
    suite.add(matcherBench(boundServerPort))
    suite.add(matcherBatchedBench(boundServerPort))
    suite.add(socketRoundTripBenchmark(boundServerPort))
    suite.add(socketRoundTripNoConnectionBenchmark(boundServerPort))
    suite.add(twoSocketRoundTripNoConnectionBenchmark(boundServerPort))
    // add listeners
    .on('cycle', function(event) {
        console.log(String(event.target));
    })
    .on('complete', function() {
        done()
    })
    // run async
    .run({ 'async': false});
}