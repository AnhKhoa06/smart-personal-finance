import { fmtDM, getPayPeriod } from "../utils/payPeriod";

export default function PayPeriodStrip({ payday }: { payday: number }) {
  const p = getPayPeriod(payday);
  const pct = Math.min(Math.max(p.progress, 0), 1) * 100;

  return (
    <div className="strip">
      <div className="strip-track">
        <div className="strip-fill" style={{ width: `${pct}%` }} />
        <span className="strip-dot" style={{ left: `${pct}%` }} />
      </div>
      <div className="strip-labels num">
        <span>{fmtDM(p.start)}</span>
        <span className="strip-today" style={{ left: `${pct}%` }}>
          hôm nay
        </span>
        <span>{fmtDM(p.end)}</span>
      </div>
    </div>
  );
}
