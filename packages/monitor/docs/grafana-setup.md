# Grafana Dashboard Setup

This guide explains how to set up the Calibrate Production Overview dashboard in Grafana.

## Prerequisites

- A running Grafana instance (v9.0+ recommended)
- Prometheus data source configured in Grafana
- Calibrate services emitting metrics to Prometheus

## Importing the Dashboard

1.  **Log in** to your Grafana instance.
2.  Navigate to **Dashboards** > **Import**.
3.  **Upload** the `packages/monitor/dashboards/main.json` file, or copy its content and paste it into the "Import via panel json" text area.
4.  Click **Load**.
5.  **Configure** the data source:
    - Select your Prometheus data source from the dropdown list.
6.  Click **Import**.

## Dashboard Panels

### API Request Rate
Shows the rate of HTTP requests per second, grouped by method and route. Useful for monitoring traffic volume and identifying spikes.

### API Error Rate (5xx)
Displays the percentage of requests returning 5xx status codes.
- **Green**: < 1%
- **Yellow**: 1-5%
- **Red**: > 5%

### API Latency (p95)
Tracks the 95th percentile response time. High latency indicates performance degradation.

### Connector Health
Shows the up/down status of external connectors (Shopify, Amazon).
- **1**: Up
- **0**: Down

### Event Bus Throughput
Monitors the number of events published and consumed by the event bus. Large discrepancies may indicate consumer lag.

### Worker Queue Depth
Displays the number of pending jobs in the worker queues. High depth indicates a backlog or stalled workers.

## Troubleshooting

- **No Data**: Ensure your services are running and scraping is configured correctly in Prometheus.
- **Missing Panels**: Check if the metric names in the dashboard JSON match those exported by your application.
