"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  CandlestickData,
  LineData,
  Time,
  SeriesMarker,
} from "lightweight-charts";

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ForecastPoint {
  time: number;
  value: number;
  upper?: number;
  lower?: number;
}

interface Props {
  candles: Candle[];
  forecastLine: ForecastPoint[];
  pathLine?: ForecastPoint[];
  upperBand: ForecastPoint[];
  lowerBand: ForecastPoint[];
  symbol: string;
  recommendation?: string;
}

export default function ForecastChart({
  candles,
  forecastLine,
  pathLine = [],
  upperBand,
  lowerBand,
  symbol,
  recommendation = "WAIT",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0a0a0a" },
        textColor: "#d1d4dc",
      },
      grid: {
        vertLines: { color: "#1a1a1a" },
        horzLines: { color: "#1a1a1a" },
      },
      width: containerRef.current.clientWidth,
      height: 520,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#2a2a2a",
      },
      rightPriceScale: {
        borderColor: "#2a2a2a",
      },
      crosshair: {
        mode: 0,
      },
    });

    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    const candleData: CandlestickData[] = candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candleSeries.setData(candleData);

    // BUY / SELL marker
    if (candles.length > 0 && (recommendation === "BUY" || recommendation === "SELL")) {
      const last = candles[candles.length - 1];
      const markers: SeriesMarker<Time>[] = [];

      if (recommendation === "BUY") {
        markers.push({
          time: last.time as Time,
          position: "belowBar",
          color: "#26a69a",
          shape: "arrowUp",
          text: "BUY",
          size: 2,
        });
      } else {
        markers.push({
          time: last.time as Time,
          position: "aboveBar",
          color: "#ef5350",
          shape: "arrowDown",
          text: "SELL",
          size: 2,
        });
      }
      candleSeries.setMarkers(markers);
    } else {
      candleSeries.setMarkers([]);
    }

    // Band
    const upperSeries = chart.addLineSeries({
      color: "rgba(33, 150, 243, 0.55)",
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const lowerSeries = chart.addLineSeries({
      color: "rgba(33, 150, 243, 0.55)",
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const areaSeries = chart.addAreaSeries({
      topColor: "rgba(33, 150, 243, 0.22)",
      bottomColor: "rgba(33, 150, 243, 0.02)",
      lineColor: "rgba(33, 150, 243, 0.35)",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // Linear mean (thin blue)
    const midSeries = chart.addLineSeries({
      color: "rgba(100, 181, 246, 0.7)",
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      title: "Linear",
    });

    // Natural path (bright white/cyan) — the main visual path
    const pathSeries = chart.addLineSeries({
      color: "#ffffff",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      title: "Path",
    });

    if (upperBand.length > 0) {
      const upperData: LineData[] = upperBand.map((p) => ({
        time: p.time as Time,
        value: p.value,
      }));
      const lowerData: LineData[] = lowerBand.map((p) => ({
        time: p.time as Time,
        value: p.value,
      }));
      upperSeries.setData(upperData);
      lowerSeries.setData(lowerData);
      areaSeries.setData(upperData);
    }

    if (forecastLine.length > 0) {
      midSeries.setData(
        forecastLine.map((p) => ({ time: p.time as Time, value: p.value }))
      );
    }

    if (pathLine.length > 0) {
      pathSeries.setData(
        pathLine.map((p) => ({ time: p.time as Time, value: p.value }))
      );

      const last = pathLine[pathLine.length - 1];
      pathSeries.setMarkers([
        {
          time: last.time as Time,
          position: "aboveBar",
          color: "#ff9800",
          shape: "circle",
          text: `Target ${last.value.toFixed(last.value < 1 ? 6 : 2)}`,
        },
      ]);
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [candles, forecastLine, pathLine, upperBand, lowerBand, symbol, recommendation]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "520px",
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid #1e1e1e",
      }}
    />
  );
}
