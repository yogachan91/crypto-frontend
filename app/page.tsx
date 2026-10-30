"use client";

import { useState, useEffect, useCallback } from "react";
import ForecastChart from "../components/ForecastChart";

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

interface Metrics {
  lookback_length: number;
  forecast_horizon: number;
  trend_slope: number;
  current_bag_price: number;
  target_price_end: number;
  visual_range_pct: number;
  alert_trigger_z: number;
  r_squared: number;
  multi_tf_alignment: string;
  confidence_score: number;
  bias: string;
  strength: string;
  recommendation: string; // strict panel BUY/SELL/WAIT
  chart_marker: string;    // lenient chart BUY/SELL/WAIT
  orderbook_imbalance: number;
  bid_ask_ratio: number;
  ob_signal: string;
  largest_bid_wall: number;
  largest_ask_wall: number;
}

interface ForecastData {
  symbol: string;
  interval: string;
  candles: Candle[];
  forecast_line: ForecastPoint[];
  path_line: ForecastPoint[];
  upper_band: ForecastPoint[];
  lower_band: ForecastPoint[];
  metrics: Metrics;
  generated_at: string;
}

const SYMBOLS = [
  { value: "BTCUSDT", label: "BTCUSDT" },
  { value: "1000SHIBUSDT", label: "1000SHIBUSDT" },
  { value: "1000PEPEUSDT", label: "1000PEPEUSDT" },
];

const INTERVALS = [
  { value: "1m",  label: "1 minute" },
  { value: "3m",  label: "3 minutes" },
  { value: "5m",  label: "5 minutes" },
  { value: "15m", label: "15 minutes" },
  { value: "1h",  label: "1 hour" },
  { value: "6h",  label: "6 hours" },
  { value: "1d",  label: "1 day" },
];

const DEFAULT_HORIZON: Record<string, number> = {
  "1m": 60,
  "3m": 40,
  "5m": 36,
  "15m": 24,
  "1h": 24,
  "6h": 12,
  "1d": 14,
};

export default function Home() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval_] = useState("1m");
  const [lookback, setLookback] = useState(30);
  const [horizon, setHorizon] = useState(60);
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (DEFAULT_HORIZON[interval]) {
      setHorizon(DEFAULT_HORIZON[interval]);
    }
  }, [interval]);

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        interval,
        lookback: String(lookback),
        horizon: String(horizon),
        limit: "200",
      });
      const res = await fetch(
        `http://127.0.0.1:8000/forecast/${symbol}?${params}`
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const json: ForecastData = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || "Failed to fetch forecast");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [symbol, interval, lookback, horizon]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  useEffect(() => {
    if (!autoRefresh) return;
    const ms = ["1m", "3m", "5m"].includes(interval) ? 30000 : 60000;
    const id = setInterval(() => {
      fetchForecast();
    }, ms);
    return () => clearInterval(id);
  }, [autoRefresh, fetchForecast, interval]);

  const biasColor = (bias: string) => {
    if (bias === "LONG") return "#26a69a";
    if (bias === "SHORT") return "#ef5350";
    return "#ff9800";
  };

  const strengthColor = (s: string) => {
    if (s === "Strong") return "#26a69a";
    if (s === "Moderate") return "#ff9800";
    if (s === "Weak") return "#ffa726";
    return "#ef5350";
  };

  const confColor = (score: number) => {
    if (score >= 70) return "#26a69a";
    if (score >= 50) return "#ff9800";
    return "#ef5350";
  };

  const recColor = (rec: string) => {
    if (rec === "BUY") return "#26a69a";
    if (rec === "SELL") return "#ef5350";
    return "#888";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#e0e0e0",
        padding: "16px 24px",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#fff" }}>
            Stat Forecast Pro v1.9
          </h1>
          <p style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
            Path + marker reaktif short-term · Multi-interval · Order Book
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} style={selectStyle}>
            {SYMBOLS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select value={interval} onChange={(e) => setInterval_(e.target.value)} style={selectStyle}>
            {INTERVALS.map((i) => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>

          <label style={{ fontSize: 13, color: "#aaa" }}>
            Lookback{" "}
            <input type="number" min={10} max={100} value={lookback}
              onChange={(e) => setLookback(Number(e.target.value))} style={inputStyle} />
          </label>

          <label style={{ fontSize: 13, color: "#aaa" }}>
            Horizon{" "}
            <input type="number" min={5} max={120} value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))} style={inputStyle} />
          </label>

          <button onClick={fetchForecast} style={btnStyle} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>

          <label style={{ fontSize: 13, color: "#aaa", display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)} />
            Auto
          </label>
        </div>
      </header>

      {error && (
        <div style={{
          background: "#3b1111", border: "1px solid #ef5350", color: "#ef9a9a",
          padding: "10px 14px", borderRadius: 6, marginBottom: 12, fontSize: 14,
        }}>
          Error: {error}
          <br />
          <span style={{ fontSize: 12, opacity: 0.8 }}>
            Pastikan backend FastAPI sudah jalan di port 8000.
          </span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, alignItems: "start" }}>
        <div>
          {data ? (
            <ForecastChart
              candles={data.candles}
              forecastLine={data.forecast_line}
              pathLine={data.path_line || []}
              upperBand={data.upper_band}
              lowerBand={data.lower_band}
              symbol={data.symbol}
              recommendation={data.metrics.chart_marker || data.metrics.recommendation}
            />
          ) : (
            <div style={{
              height: 520, background: "#111", borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#666", border: "1px solid #1e1e1e",
            }}>
              {loading ? "Memuat data…" : "Tidak ada data"}
            </div>
          )}
        </div>

        {/* Metrics Panel */}
        <div style={{
          background: "#111111", border: "1px solid #1e1e1e",
          borderRadius: 8, padding: 14, fontSize: 13,
        }}>
          <div style={{
            fontWeight: 600, marginBottom: 12, color: "#ff9800",
            fontSize: 14, borderBottom: "1px solid #222", paddingBottom: 8,
          }}>
            SIGNAL
          </div>

          {data ? (
            <>
              {/* RECOMMENDATION - most important */}
              <div style={{
                background: "#1a1a1a",
                border: `2px solid ${recColor(data.metrics.recommendation)}`,
                borderRadius: 8, padding: "14px 12px", marginBottom: 10,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>REKOMENDASI</div>
                <div style={{
                  fontSize: 26, fontWeight: 800, letterSpacing: 1,
                  color: recColor(data.metrics.recommendation),
                }}>
                  {data.metrics.recommendation}
                </div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
                  {data.metrics.recommendation === "BUY" && "Pertimbangan masuk LONG"}
                  {data.metrics.recommendation === "SELL" && "Pertimbangan masuk SHORT"}
                  {data.metrics.recommendation === "WAIT" && "Lebih baik diam / tidak entry"}
                </div>
              </div>

              {/* BIAS */}
              <div style={{
                background: "#1a1a1a",
                border: `1px solid ${biasColor(data.metrics.bias)}`,
                borderRadius: 6, padding: "8px 12px", marginBottom: 8,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 11, color: "#888" }}>BIAS</div>
                <div style={{
                  fontSize: 16, fontWeight: 700,
                  color: biasColor(data.metrics.bias),
                }}>
                  {data.metrics.bias}
                </div>
              </div>

              {/* STRENGTH */}
              <div style={{
                background: "#1a1a1a",
                border: `1px solid ${strengthColor(data.metrics.strength)}`,
                borderRadius: 6, padding: "8px 12px", marginBottom: 12,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 11, color: "#888" }}>STRENGTH</div>
                <div style={{
                  fontSize: 15, fontWeight: 700,
                  color: strengthColor(data.metrics.strength),
                }}>
                  {data.metrics.strength}
                </div>
              </div>

              {/* Confidence */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#888", fontSize: 12 }}>Confidence</span>
                  <span style={{
                    fontWeight: 700, fontFamily: "monospace",
                    color: confColor(data.metrics.confidence_score),
                  }}>
                    {data.metrics.confidence_score}%
                  </span>
                </div>
                <div style={{
                  height: 8, background: "#222", borderRadius: 4, overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    width: `${data.metrics.confidence_score}%`,
                    background: confColor(data.metrics.confidence_score),
                    borderRadius: 4,
                    transition: "width 0.4s ease",
                  }} />
                </div>
              </div>

              {/* Order Book */}
              <div style={{
                background: "#0d0d0d", border: "1px solid #222",
                borderRadius: 6, padding: "10px 12px", marginBottom: 12,
              }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 8, fontWeight: 600 }}>
                  ORDER BOOK (pendukung)
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ color: "#888", fontSize: 12 }}>Signal</span>
                  <span style={{ fontWeight: 600, fontSize: 12.5 }}>
                    {data.metrics.ob_signal}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#888", fontSize: 12 }}>Imbalance</span>
                  <span style={{
                    fontFamily: "monospace", fontSize: 12.5,
                    color: data.metrics.orderbook_imbalance > 0.1 ? "#26a69a" :
                           data.metrics.orderbook_imbalance < -0.1 ? "#ef5350" : "#aaa",
                  }}>
                    {data.metrics.orderbook_imbalance > 0 ? "+" : ""}
                    {data.metrics.orderbook_imbalance.toFixed(3)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#888", fontSize: 12 }}>Bid/Ask Ratio</span>
                  <span style={{ fontFamily: "monospace", fontSize: 12.5 }}>
                    {data.metrics.bid_ask_ratio.toFixed(3)}
                  </span>
                </div>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <MetricRow label="Interval" value={data.interval} />
                  <MetricRow label="Multi-TF Align" value={data.metrics.multi_tf_alignment}
                    color={data.metrics.multi_tf_alignment === "Aligned" ? "#26a69a" :
                      data.metrics.multi_tf_alignment === "Mostly Aligned" ? "#ff9800" : "#ef5350"} />
                  <MetricRow label="R² (Fit)" value={data.metrics.r_squared} />
                  <MetricRow label="Trend Slope" value={data.metrics.trend_slope}
                    color={data.metrics.trend_slope >= 0 ? "#26a69a" : "#ef5350"} />
                  <MetricRow label="Current Price" value={data.metrics.current_bag_price} />
                  <MetricRow label="Target Price" value={data.metrics.target_price_end} color="#ff9800" />
                  <MetricRow label="Visual Range %" value={`${data.metrics.visual_range_pct}%`} />
                  <MetricRow label="Lookback / Horizon"
                    value={`${data.metrics.lookback_length} / ${data.metrics.forecast_horizon}`} />
                </tbody>
              </table>
            </>
          ) : (
            <div style={{ color: "#666" }}>—</div>
          )}

          {data && (
            <div style={{
              marginTop: 16, fontSize: 11, color: "#666",
              borderTop: "1px solid #222", paddingTop: 10,
            }}>
              Generated: {new Date(data.generated_at).toLocaleString()}
              <br />
              {data.symbol} · {data.interval}
            </div>
          )}

          <div style={{
            marginTop: 20, padding: 10, background: "#1a1200",
            border: "1px solid #5d4037", borderRadius: 6,
            fontSize: 11, color: "#ffcc80", lineHeight: 1.45,
          }}>
            ⚠️ <strong>Cara baca:</strong><br />
            • Tanda di grafik mengikuti momentum pendek + Order Book<br />
            • Bisa muncul SELL meski path masih agak naik (jika tekanan jual jelas)<br />
            • Move terlalu kecil = tidak ada tanda<br />
            • REKOMENDASI panel tetap lebih ketat<br /><br />
            Demo saja. Bukan saran investasi. Crypto berisiko.
          </div>
        </div>
      </div>

      <footer style={{ marginTop: 24, textAlign: "center", fontSize: 12, color: "#555" }}>
        Statistical Trend Forecast v1.9 · Reactive short-term markers · Binance Futures
      </footer>
    </div>
  );
}

function MetricRow({
  label, value, color = "#e0e0e0",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <tr>
      <td style={{ padding: "5px 0", color: "#888", fontSize: 12 }}>{label}</td>
      <td style={{
        padding: "5px 0", textAlign: "right", fontWeight: 500,
        color, fontFamily: "monospace", fontSize: 12.5,
      }}>
        {value}
      </td>
    </tr>
  );
}

const selectStyle: React.CSSProperties = {
  background: "#1a1a1a", color: "#e0e0e0", border: "1px solid #333",
  borderRadius: 6, padding: "6px 10px", fontSize: 13,
};

const inputStyle: React.CSSProperties = {
  background: "#1a1a1a", color: "#e0e0e0", border: "1px solid #333",
  borderRadius: 4, padding: "4px 8px", width: 60, marginLeft: 4, fontSize: 13,
};

const btnStyle: React.CSSProperties = {
  background: "#1e88e5", color: "#fff", border: "none",
  borderRadius: 6, padding: "6px 14px", fontSize: 13, fontWeight: 500,
};
