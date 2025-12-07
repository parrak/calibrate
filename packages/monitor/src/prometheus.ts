import { Registry, Gauge, Counter, Histogram, collectDefaultMetrics } from 'prom-client'

// Global registry
const register = new Registry()

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register })

// Metric storage
const gauges = new Map<string, Gauge>()
const counters = new Map<string, Counter>()
const histograms = new Map<string, Histogram>()

/**
 * Register a Gauge metric
 */
export function registerGauge(name: string, help: string, labelNames: string[] = []) {
    if (gauges.has(name)) return gauges.get(name)!

    const gauge = new Gauge({
        name,
        help,
        labelNames,
        registers: [register]
    })
    gauges.set(name, gauge)
    return gauge
}

/**
 * Set a Gauge value
 */
export function setGauge(name: string, value: number, labels: Record<string, string> = {}) {
    const gauge = gauges.get(name)
    if (gauge) {
        gauge.set(labels, value)
    }
}

/**
 * Register a Counter metric
 */
export function registerCounter(name: string, help: string, labelNames: string[] = []) {
    if (counters.has(name)) return counters.get(name)!

    const counter = new Counter({
        name,
        help,
        labelNames,
        registers: [register]
    })
    counters.set(name, counter)
    return counter
}

/**
 * Increment a Counter
 */
export function incrementCounter(name: string, value: number = 1, labels: Record<string, string> = {}) {
    const counter = counters.get(name)
    if (counter) {
        counter.inc(labels, value)
    }
}

/**
 * Register a Histogram metric
 */
export function registerHistogram(name: string, help: string, labelNames: string[] = [], buckets: number[] = [0.1, 0.5, 1, 2, 5, 10]) {
    if (histograms.has(name)) return histograms.get(name)!

    const histogram = new Histogram({
        name,
        help,
        labelNames,
        buckets,
        registers: [register]
    })
    histograms.set(name, histogram)
    return histogram
}

/**
 * Observe a Histogram value
 */
export function observeHistogram(name: string, value: number, labels: Record<string, string> = {}) {
    const histogram = histograms.get(name)
    if (histogram) {
        histogram.observe(labels, value)
    }
}

/**
 * Get metrics content type
 */
export function getMetricsContentType() {
    return register.contentType
}

/**
 * Get all metrics
 */
export function getMetrics() {
    return register.metrics()
}
