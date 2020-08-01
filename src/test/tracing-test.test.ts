import {
  init, TraceMemoryUnit, exportTrace, traceMemory, exportTraceToCSV,
} from '../MemTrace';

// this test dosn't really do much at the moment
// currently trying to design a good way to do testing for this module
test('test tracing', () => {
  init(TraceMemoryUnit.Byte);
  traceMemory('testTrace-1');
  traceMemory('testTrace-2');
  traceMemory('testTrace-3');
  traceMemory('testTrace-4');
  traceMemory('testTrace-5');
  const exportedTraces = exportTrace();
  if (exportedTraces !== undefined) {
    console.debug(`record 1:${exportedTraces[0].heapUsed}`);
    console.debug(`record 2:${exportedTraces[1].heapUsed}`);
    console.debug(`Memory change: ${JSON.stringify(exportedTraces[4].heapUsed - exportedTraces[0].heapUsed)}`);
  }
  exportTraceToCSV('test.csv');
});
