const Benchmark = require("benchmark");
const suite = new Benchmark.Suite("OrderBook");
const matcherBench = require("./matcherBenchmark");
const matcherManySocketBench = require("./matcherManySocketBenchmark");
const matcherBatchedBench = require("./matcherBatchedBenchmark");
const matcherNoSocketBench = require("./matcherNoSocketBenchmark");
const socketRoundTripBenchmark = require("./socketRoundTripBenchmark");
const socketRoundTripNoConnectionBenchmark = require("./socketRoundTripNoConnectionBenchmark");
const twoSocketRoundTripNoConnectionBenchmark = require("./twoSocketRoundTripNoConnectionBenchmark");

module.exports = (boundServerPort, done) => {
  // add tests
  suite.add(matcherNoSocketBench);

  // Testing some alternatives
  suite.add(matcherBench(boundServerPort));
  suite.add(matcherManySocketBench(boundServerPort));
  suite.add(matcherBatchedBench(boundServerPort));

  // These were added to work out how to speed things up
  suite.add(socketRoundTripBenchmark(boundServerPort));
  suite.add(socketRoundTripNoConnectionBenchmark(boundServerPort));
  suite
    .add(twoSocketRoundTripNoConnectionBenchmark(boundServerPort))

    // add listeners
    .on("cycle", event => {
      console.log(String(event.target));
    })
    .on("complete", () => {
      done();
    })
    // run async
    .run({ async: false });
};
