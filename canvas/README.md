# Why?

This is a mock module for `canvas`. Nteract has a ignored require and undeclared dependency on this module. `cavnas` is a server side node module and is not used in browser side code for nteract.

Installing it locally (`npm install canvas`) will resolve the problem, but it is a native module so it is flaky depending on the system, node version, processor arch, etc. This module provides a simpler, more robust solution.

Remove this workaround if [this bug](https://github.com/nteract/any-vega/issues/2) ever gets resolved 