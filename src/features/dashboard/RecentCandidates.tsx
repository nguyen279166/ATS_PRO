import { History } from "lucide-react";
import Avatar from "../../components/Avatar";
import type { Candidate } from "../../types";
import { formatDate } from "../../utils/date";
import { DASHBOARD_STATUS_META } from "./dashboardData";

type RecentCandidatesProps = {
  candidates: Candidate[];
};

const CandidateStatusBadge = ({ candidate }: { candidate: Candidate }) => {
  const status = DASHBOARD_STATUS_META[candidate.status];
  return (
    <span className={`sahara-status ${status.statusClass}`}>
      {status.label}
    </span>
  );
};

export function RecentCandidates({ candidates }: RecentCandidatesProps) {
  return (
    <section
      className='sahara-card min-w-0 p-4 sm:p-5'
      aria-labelledby='dashboard-recent-title'
    >
      <h2
        id='dashboard-recent-title'
        className='flex items-center gap-2 text-lg font-bold text-[var(--color-text)]'
      >
        <History
          size={20}
          className='text-[var(--color-primary)]'
          aria-hidden='true'
        />
        Ứng viên gần đây
      </h2>
      <p className='mt-2 text-sm leading-6 text-[var(--color-text-muted)]'>
        {candidates.length > 0
          ? `Hiển thị ${candidates.length} hồ sơ mới nhất theo ngày nộp.`
          : "Chưa có hồ sơ ứng viên gần đây."}
      </p>

      {candidates.length > 0 ? (
        <>
          <ul className='mt-4 space-y-3 md:hidden'>
            {candidates.map((candidate) => (
              <li key={candidate.id}>
                <article
                  className='sahara-card-soft p-4'
                  aria-label={`Ứng viên ${candidate.name}`}
                >
                  <div className='flex min-w-0 items-start gap-3'>
                    <span aria-hidden='true'>
                      <Avatar
                        name={candidate.name}
                        src={candidate.avatar}
                        className='h-10 w-10 text-sm'
                      />
                    </span>
                    <div className='min-w-0 flex-1'>
                      <h3 className='font-bold text-[var(--color-text)]'>
                        {candidate.name}
                      </h3>
                      <p className='break-all text-sm text-[var(--color-text-muted)]'>
                        {candidate.email}
                      </p>
                    </div>
                    <CandidateStatusBadge candidate={candidate} />
                  </div>
                  <dl className='mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2'>
                    <div>
                      <dt className='font-semibold text-[var(--color-text-muted)]'>
                        Vị trí
                      </dt>
                      <dd className='mt-0.5 text-[var(--color-text)]'>
                        {candidate.job?.title || "Chưa xác định"}
                      </dd>
                    </div>
                    <div>
                      <dt className='font-semibold text-[var(--color-text-muted)]'>
                        Ngày nộp
                      </dt>
                      <dd className='mt-0.5 text-[var(--color-text)]'>
                        <time dateTime={candidate.appliedDate}>
                          {formatDate(candidate.appliedDate)}
                        </time>
                      </dd>
                    </div>
                  </dl>
                </article>
              </li>
            ))}
          </ul>

          <div className='mt-4 hidden overflow-x-auto md:block'>
            <table className='sahara-table min-w-[720px] text-left'>
              <caption className='sr-only'>
                Danh sách {candidates.length} ứng viên mới nhất
              </caption>
              <thead>
                <tr>
                  <th scope='col' className='px-3 py-3'>
                    Tên ứng viên
                  </th>
                  <th scope='col' className='px-3 py-3'>
                    Email
                  </th>
                  <th scope='col' className='px-3 py-3'>
                    Vị trí
                  </th>
                  <th scope='col' className='px-3 py-3'>
                    Trạng thái
                  </th>
                  <th scope='col' className='px-3 py-3'>
                    Ngày nộp
                  </th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr key={candidate.id}>
                    <th scope='row' className='px-3 py-3 font-medium'>
                      <div className='flex items-center gap-3'>
                        <span aria-hidden='true'>
                          <Avatar
                            name={candidate.name}
                            src={candidate.avatar}
                            className='h-8 w-8 text-xs'
                          />
                        </span>
                        <span className='text-[var(--color-text)]'>
                          {candidate.name}
                        </span>
                      </div>
                    </th>
                    <td className='px-3 py-3 text-sm text-[var(--color-text-muted)]'>
                      {candidate.email}
                    </td>
                    <td className='px-3 py-3 text-sm text-[var(--color-text-muted)]'>
                      {candidate.job?.title || "Chưa xác định"}
                    </td>
                    <td className='px-3 py-3'>
                      <CandidateStatusBadge candidate={candidate} />
                    </td>
                    <td className='px-3 py-3 text-sm text-[var(--color-text-muted)]'>
                      <time dateTime={candidate.appliedDate}>
                        {formatDate(candidate.appliedDate)}
                      </time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div
          className='mt-4 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-8 text-center text-sm font-semibold text-[var(--color-text-muted)]'
          role='status'
        >
          Hồ sơ mới sẽ xuất hiện tại đây sau khi ứng viên nộp đơn.
        </div>
      )}
    </section>
  );
}
