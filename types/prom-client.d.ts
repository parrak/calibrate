declare module 'prom-client' {
  export class Registry {
    contentType: string
    metrics(): string
  }

  export interface MetricConfig {
    name: string
    help: string
    labelNames?: string[]
    registers?: Registry[]
  }

  export class Gauge {
    constructor(config: MetricConfig)
    set(labels: Record<string, string>, value: number): void
  }

  export class Counter {
    constructor(config: MetricConfig)
    inc(labels: Record<string, string>, value?: number): void
  }

  export class Histogram {
    constructor(config: MetricConfig & { buckets?: number[] })
    observe(labels: Record<string, string>, value: number): void
  }

  export function collectDefaultMetrics(config?: { register?: Registry }): void
}
