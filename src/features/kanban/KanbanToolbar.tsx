import {
  ArrowLeft,
  Building2,
  MapPin,
  Plus,
  Search,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";

type KanbanToolbarProps = {
  jobTitle: string;
  department: string;
  location: string;
  candidateCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddCandidate: () => void;
};

export default function KanbanToolbar({
  jobTitle,
  department,
  location,
  candidateCount,
  searchTerm,
  onSearchChange,
  onAddCandidate,
}: KanbanToolbarProps) {
  return (
    <header className='kanban-hero px-5 py-5 text-white sm:px-7 sm:py-6'>
      <div className='flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between'>
        <div className='min-w-0'>
          <div className='mb-4 flex flex-wrap items-center gap-3'>
            <Link
              to='/jobs'
              className='inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 text-xs font-bold text-white/75 transition-colors hover:bg-white/10 hover:text-white'
            >
              <ArrowLeft aria-hidden='true' size={16} />
              Danh sách công việc
            </Link>
            <span className='inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#ffbf77]'>
              <span
                className='h-2 w-2 rounded-full bg-[#ffb55f] shadow-[0_0_0_5px_rgba(255,181,95,0.12)]'
                aria-hidden='true'
              />
              Pipeline đang hoạt động
            </span>
          </div>

          <h1
            id='kanban-page-title'
            className='sahara-page-title max-w-3xl text-[2rem] font-black text-white focus:outline-none sm:text-[2.8rem]'
            tabIndex={-1}
          >
            {jobTitle}
          </h1>

          <div className='mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-white/65 sm:text-sm'>
            <span className='inline-flex items-center gap-2'>
              <Building2 aria-hidden='true' size={16} />
              {department || "Chưa phân loại"}
            </span>
            <span className='inline-flex items-center gap-2'>
              <MapPin aria-hidden='true' size={16} />
              {location || "Chưa có địa điểm"}
            </span>
            <span className='inline-flex items-center gap-2 text-white'>
              <UsersRound aria-hidden='true' size={16} />
              <strong className='font-black tabular-nums'>{candidateCount}</strong> ứng viên
            </span>
          </div>
        </div>

        <div
          className='flex w-full flex-col gap-3 sm:flex-row xl:w-auto'
          role='search'
        >
          <div className='relative min-w-0 flex-1 sm:min-w-80 xl:w-96'>
            <label className='sr-only' htmlFor='kanban-candidate-search'>
              Tìm ứng viên theo tên
            </label>
            <Search
              aria-hidden='true'
              className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/55'
              size={18}
            />
            <input
              id='kanban-candidate-search'
              type='search'
              placeholder='Tìm ứng viên trong pipeline...'
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              className='min-h-12 w-full rounded-xl border border-white/10 bg-white/[0.09] pl-11 pr-4 text-sm font-semibold text-white shadow-inner outline-none transition-colors placeholder:text-white/45 focus:border-[#ffb55f]/70 focus:bg-white/[0.13] focus:ring-4 focus:ring-[#ffb55f]/10'
            />
          </div>
          <button
            type='button'
            onClick={onAddCandidate}
            className='inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#ffb55f] px-5 text-sm font-black text-[#251408] shadow-[0_12px_28px_rgba(255,181,95,0.2)] transition-[filter,transform] hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 sm:w-auto'
          >
            <Plus aria-hidden='true' size={18} strokeWidth={2.5} />
            Thêm ứng viên
          </button>
        </div>
      </div>
    </header>
  );
}
