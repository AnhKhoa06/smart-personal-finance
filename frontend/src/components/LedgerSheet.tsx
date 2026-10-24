import {
  LuBanknote,
  LuFuel,
  LuLock,
  LuShoppingBag,
  LuUtensils,
} from "react-icons/lu";
import PayPeriodStrip from "./PayPeriodStrip";
import {
  dailyAllowance,
  fmtDM,
  formatVND,
  getPayPeriod,
} from "../utils/payPeriod";

type Props = { income?: number; payday?: number };

const rows = [
  { icon: LuUtensils, name: "Cơm trưa - tối", cat: "Ăn uống", amt: -45000 },
  { icon: LuShoppingBag, name: "Mua sắm", cat: "Mua sắm", amt: -62000 },
  { icon: LuFuel, name: "Đổ xăng", cat: "Di chuyển", amt: -80000 },
  { icon: LuBanknote, name: "Tiền lương", cat: "Lương", amt: 22000000 },
];

export default function LedgerSheet({ income, payday }: Props) {
  const day = payday && payday >= 1 && payday <= 31 ? payday : 5;
  const inc = income && income > 0 ? income : 22000000;
  const period = getPayPeriod(day);
  const spent = inc * 0.38 * Math.min(Math.max(period.progress, 0.05), 1);
  const allowance = dailyAllowance(inc, spent, period.daysLeft);
  const isLive = !!(income && payday);

  return (
    <div className="ledger-wrap" aria-hidden="true">
      <div className="ledger-back" />
      <div className="ledger">
        <header className="ledger-head">
          <span>Sổ thu chi</span>
          <span className="num">
            Kỳ {fmtDM(period.start)} – {fmtDM(period.end)}
          </span>
        </header>

        <p className="ledger-q">Hôm nay còn chi được</p>
        <p className="ledger-big num">{formatVND(allowance)}</p>
        <p className="ledger-sub">
          Còn {period.daysLeft} ngày đến kỳ lương
          {isLive ? " · tính từ số bạn vừa nhập" : " · số liệu mẫu"}
        </p>

        <PayPeriodStrip payday={day} />

        <ul className="ledger-rows">
          {rows.map((r) => (
            <li key={r.name}>
              <r.icon size={16} className="row-icon" />
              <div>
                <strong>{r.name}</strong>
                <small>{r.cat}</small>
              </div>
              <span className={`num ${r.amt > 0 ? "in" : "out"}`}>
                {r.amt > 0 ? "+" : "−"}
                {new Intl.NumberFormat("vi-VN").format(Math.abs(r.amt))}
              </span>
            </li>
          ))}
        </ul>

        <footer className="ledger-foot">
          <span>
            <LuLock size={14} /> Phiên theo từng thiết bị
          </span>
        </footer>
      </div>
      <span className="ledger-stamp">Ước tính</span>
    </div>
  );
}
