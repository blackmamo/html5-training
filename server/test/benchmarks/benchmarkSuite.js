var Benchmark = require('benchmark');
var Matcher = require('./matcherBenchmark')

var suite = new Benchmark.Suite;

// add tests
suite.add(Matcher.SimpleTest)
// add listeners
.on('cycle', function(event) {
    console.log(String(event.target));
})
// run async
.run({ 'async': false});