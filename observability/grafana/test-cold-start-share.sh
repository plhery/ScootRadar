#!/bin/sh
# Run with promtool and jq on PATH. Exercise the expression actually shipped to Grafana.
set -eu
dashboard=$(dirname "$0")/scootradar-cache.json
expr=$(jq -er '.panels[] | select(.id == 46) | .targets[0].expr' "$dashboard")
fixture=$(mktemp)
trap 'rm -f "$fixture"' EXIT
cat > "$fixture" <<YAML
tests:
  - interval: 1m
    input_series:
      - series: 'scootradar_refreshes_total{job="scootradar-cache",provider="failed",kind="cold",outcome="failed"}'
        values: '0+1x60'
      - series: 'scootradar_refreshes_total{job="scootradar-cache",provider="idle",kind="cold",outcome="failed"}'
        values: '3+0x60'
      - series: 'scootradar_refreshes_total{job="scootradar-cache",provider="busy",kind="cold",outcome="success"}'
        values: '0+2x60'
      - series: 'scootradar_refresh_seconds_bucket{job="scootradar-cache",provider="busy",kind="cold",phase="start",le="15.0"}'
        values: '0+1x60'
    promql_expr_test:
      - expr: |
          $expr
        eval_time: 60m
        exp_samples:
          - {labels: '{provider="failed"}', value: 0}
          - {labels: '{provider="busy"}', value: 0.5}
YAML
promtool test rules "$fixture"
