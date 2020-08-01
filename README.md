# ts-mem-trace

ts-mem-trace is a node module designed to provide tracing and export of nodes memory use
during the execution of a program. 

To implement this ts-mem-trace wraps the data provided by process.memoryUsage().

to get the best results programs should be run with --expose_gc this allows for more control over when garbage collection happens.

### paramaters: 
init() can be passed a TraceMemoryUnit this controls the SI unit that the tracer exports its data in
* allowed values: 
  * Byte,
  * KiloByte,
  * MegaByte,
  * GigaByte,


### output data: 

``` typescript
  recordName: string; // the name provided when creating the trace
  memoryUnit: TraceMemoryUnit; //SI unit for the exported data
  heapTotal: number; // The total heap allocated to the node process
  heapUsed: number; // The total heap used by the node process
  external: number; // Memory allocated to external parts of the runtime, C++ objects ect
  rss: number; // resident set size: the total memory allocated to the node process
  traceDateTime: number; // unix timestamp from the trace
  traceKey: string; //hash of the unix timestamp at init used to identify all traces from the same run.
```

 Example: 
``` typescript
import { init, traceMemory, exportTraceToCSV, exportTrace, TraceMemoryUnit, traceBlock} from "ts-mem-trace";
const array = [];
init(TraceMemoryUnit.KiloByte);
traceMemory("0");
traceBlock("test-block", () => {
  for (let x = 0; x < 1000; x++) {
    array.push(x);
  }
});
traceMemory("1");
const records = exportTrace();
if (records != undefined) {
  records.forEach((item) => {
    console.log("name: " + item.recordName + " heapUsed: " + item.heapUsed);
  });
}
```

```console
name: 0 heapUsed: 3833.8046875
name: test-block-block-start heapUsed: 3813.5390625
name: test-block-block-end heapUsed: 3856.65625
name: 1 heapUsed: 3819.890625
```


* todo:
  * split this up into multiple files.
  * move export code from.
  * add custom record export support.
  * add tree based tracing so data can be associated to a stack allowing for flame graphs and the such.
  * implement a version that exports the data via http so tracing can be done on machines without disk access (Lambda ect)