import * as fs from 'fs';
import os from 'os';
import memoryUse = NodeJS.MemoryUsage;

const hash = require('object-hash');

let useGC = true;
const traceKey = hash(Date.now());

export enum TraceMemoryUnit {
  Byte,
  KiloByte,
  MegaByte,
  GigaByte,
}

export interface ExportMemoryRecord {
  recordName: string;
  memoryUnit: TraceMemoryUnit;
  heapTotal: number;
  heapUsed: number;
  external: number;
  rss: number;
  traceDateTime: number;
  traceKey: string;
}

class MemTracer {
  private traceMemoryUnit: TraceMemoryUnit;

  private records: MemoryRecord[] = [];

  private csvHeader = [
    'name',
    'trace token',
    'trace time stamp',
    'heap used',
    'heap total',
    'rss'];

  constructor(
    traceMemoryUnit: TraceMemoryUnit,
  ) {
    this.traceMemoryUnit = traceMemoryUnit;

    for (let i = 3; i < 6; i += 1) {
      this.csvHeader[i] = `${this.csvHeader[i]} (${TraceMemoryUnit[traceMemoryUnit]})`;
    }
  }

  recordTrace(name:string, defaultGCBehaviour: boolean = true) {
    if (defaultGCBehaviour && useGC) {
      global.gc();
    }

    const record: MemoryRecord = {
      recordName: name,
      memoryUsage: process.memoryUsage(),
      traceDateTime: Date.now(),
    };
    this.records.push(record);
  }

  convertMemValueToUnit(memoryValue: number) {
    switch (this.traceMemoryUnit) {
      case TraceMemoryUnit.KiloByte:
        return memoryValue / 1024;
      case TraceMemoryUnit.MegaByte:
        return memoryValue / 1024 / 1024;
      case TraceMemoryUnit.GigaByte:
        return memoryValue / 1024 / 1024 / 1024;
      case TraceMemoryUnit.Byte:
      default:
        break;
    }
    return memoryValue;
  }

  exportTrace(): ExportMemoryRecord[] {
    const recordData: ExportMemoryRecord[] = [];
    this.records.forEach((data: MemoryRecord) => {
      const traceData: ExportMemoryRecord = {
        ...data,
        traceKey,
        memoryUnit: this.traceMemoryUnit,
        rss: this.convertMemValueToUnit(data.memoryUsage.rss),
        heapTotal: this.convertMemValueToUnit(data.memoryUsage.heapTotal),
        heapUsed: this.convertMemValueToUnit(data.memoryUsage.heapUsed),
        external: this.convertMemValueToUnit(data.memoryUsage.external),
      };

      recordData.push(traceData);
    });
    return recordData;
  }

  exportTracesAsCSVText(): string {
    let fileData = '';
    this.csvHeader.forEach((entry) => {
      fileData += `${entry},`;
    });
    fileData += os.EOL;
    this.records.forEach((entry) => {
      fileData += `${entry.recordName},`;
      fileData += `${traceKey},`;
      fileData += `${entry.traceDateTime},`;
      fileData += `${this.convertMemValueToUnit(entry.memoryUsage.heapUsed)},`;
      fileData += `${this.convertMemValueToUnit(entry.memoryUsage.heapTotal)},`;
      fileData += `${this.convertMemValueToUnit(entry.memoryUsage.rss)},`;
      fileData += os.EOL;
    });
    return fileData;
  }
}

let tracer: MemTracer | undefined;

interface MemoryRecord {
  recordName: string;
  memoryUsage: memoryUse;
  traceDateTime: number;
}

interface VerboseMemoryRecord extends MemoryRecord {
  stackTrace: string
}

export function init(
  traceMemoryUnit: TraceMemoryUnit = TraceMemoryUnit.Byte,
) {
  if (!global.gc) {
    useGC = false;
    // tslint:disable-next-line: no-console
    console.log("manual GC call not enabled please run node with --expose_gc to get more accurate tracing'");
  }
  tracer = new MemTracer(traceMemoryUnit);
}

export function traceMemory(name: string) {
  if (tracer !== undefined) {
    tracer.recordTrace(name, true);
  }
}

export function traceBlock(name: string, callback: () => void) {
  if (tracer !== undefined) {
    tracer.recordTrace(`${name}-block-start`, true);
    callback();
    tracer.recordTrace(`${name}-block-end`, true);
  } else {
    callback();
  }
}

export function exportTrace(): ExportMemoryRecord[] | undefined {
  if (tracer !== undefined) {
    return tracer.exportTrace();
  }
  return undefined;
}

export function exportTraceToCSV(fileName: string) {
  if (tracer !== undefined) {
    const result = tracer.exportTracesAsCSVText();
    fs.writeFileSync(fileName, result);
  }
}
