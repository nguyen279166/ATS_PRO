import { TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyApplicationData } from "./dashboardData";

type ApplicationTrendChartProps = {
  data: MonthlyApplicationData[];
};

export function ApplicationTrendChart({
  data,
}: ApplicationTrendChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const peak = data.reduce<MonthlyApplicationData | null>(
    (currentPeak, item) =>
      !currentPeak || item.count > currentPeak.count ? item : currentPeak,
    null,
  );
  const summary =
    total > 0 && peak
      ? `Có ${total} lượt ứng tuyển trong 6 tháng gần nhất. Tháng cao nhất là ${peak.month} với ${peak.count} ứng viên.`
      : "Chưa có lượt ứng tuyển trong 6 tháng gần nhất.";

  return (
    <section
      className='sahara-card min-w-0 p-4 sm:p-5'
      aria-labelledby='dashboard-trend-title'
    >
      <h2
        id='dashboard-trend-title'
        className='flex items-center gap-2 text-lg font-bold text-[var(--color-text)]'
      >
        <TrendingUp
          size={20}
          className='text-[var(--color-primary)]'
          aria-hidden='true'
        />
        Xu hướng ứng tuyển trong 6 tháng
      </h2>
      <p
        id='dashboard-trend-summary'
        className='mt-2 text-sm leading-6 text-[var(--color-text-muted)]'
      >
        {summary}
      </p>

      {total > 0 ? (
        <>
          <div
            className='mt-4 h-60 min-w-0'
            role='img'
            aria-labelledby='dashboard-trend-title dashboard-trend-summary'
          >
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart
                data={data}
                margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
                accessibilityLayer
              >
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='var(--color-border)'
                />
                <XAxis
                  dataKey='month'
                  tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
                />
                <Tooltip
                  labelFormatter={(label) => `Tháng ${String(label)}`}
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                    fontSize: 13,
                  }}
                  labelStyle={{ color: "var(--color-text)" }}
                  itemStyle={{ color: "var(--color-primary)" }}
                  cursor={{ stroke: "var(--color-border)" }}
                />
                <Line
                  type='monotone'
                  dataKey='count'
                  name='Ứng viên'
                  stroke='var(--color-primary)'
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--color-primary)" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <table className='sr-only'>
            <caption>Số ứng viên theo từng tháng trong 6 tháng gần nhất</caption>
            <thead>
              <tr>
                <th scope='col'>Tháng</th>
                <th scope='col'>Số ứng viên</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.month}>
                  <th scope='row'>{item.month}</th>
                  <td>{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <div
          className='mt-4 flex min-h-60 items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-6 text-center text-sm font-semibold text-[var(--color-text-muted)]'
          role='status'
        >
          Dữ liệu xu hướng sẽ xuất hiện sau khi có hồ sơ ứng tuyển.
        </div>
      )}
    </section>
  );
}
