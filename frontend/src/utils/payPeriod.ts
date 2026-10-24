export const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(n)) + " ₫";

export type PayPeriod = {
  start: Date;
  end: Date; // ngày nhận lương kế tiếp
  totalDays: number;
  elapsed: number;
  daysLeft: number;
  progress: number; // 0..1
};

const DAY = 86_400_000;

export function getPayPeriod(payday: number, today = new Date()): PayPeriod {
  const d = Math.min(Math.max(Math.floor(payday) || 1, 1), 28);
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  let start = new Date(t.getFullYear(), t.getMonth(), d);
  if (start > t) start = new Date(t.getFullYear(), t.getMonth() - 1, d);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, d);

  const totalDays = Math.round((end.getTime() - start.getTime()) / DAY);
  const elapsed = Math.floor((t.getTime() - start.getTime()) / DAY);
  return {
    start,
    end,
    totalDays,
    elapsed,
    daysLeft: totalDays - elapsed,
    progress: elapsed / totalDays,
  };
}

export const fmtDM = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;

// Ước tính số được chi mỗi ngày: (thu nhập - đã chi) / số ngày còn lại
export function dailyAllowance(
  income: number,
  spent: number,
  daysLeft: number,
) {
  return Math.max(income - spent, 0) / Math.max(daysLeft, 1);
}
