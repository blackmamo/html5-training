// These perf tests measure just the matcher in isolation

// I find it quite hard to do simple tests for the matcher, since the state that is built up
// will be giant, e.g. all the orders, and the depth in the book.
// I have modified things so that the store of orders can be turned off to stop that state build up
// being a concern. I have also had to design the tests so that each invocation leaves the depth empty
// This means that the test I concocted is:
//  1. Build depth on both sides of the market, 10 levels, with 10 orders each, all size 1
//  2. Submit orders that cross the spread and fill all of both sides, size 100, i.e. all depth consumed

module.exports = {
    SimpleTest: {
        name: 'SimpleTest',
        fn: function(){console.log("unit")},
        onComplete: function(){console.log("complete")},
        onCycle: function(){console.log("cycle")},
        onReset: function(){console.log("reset")},
        onStart: function(){console.log("start")},
        setup: function(){console.log("setup")},
        teardown: function(){console.log("teardown")},
        maxTime: 1.0,
        hz: 1
    }
}