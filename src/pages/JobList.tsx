import { mockJobs } from "../api/mockData";
import { Calendar, MapPin, Building } from "lucide-react";
import { Link } from "react-router-dom";

export default function JobList() {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {mockJobs.map((job) => (
        <div
          key={job.id}
          className='bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group'
        >
          <div className='flex justify-between items-start mb-4'>
            <h3 className='font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors'>
              {job.title}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                job.status === "Open"
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {job.status}
            </span>
          </div>

          <div className='space-y-3 text-slate-500 text-sm mb-6'>
            <div className='flex items-center gap-2'>
              <Building size={16} className='text-slate-400' />{" "}
              <span>{job.department}</span>
            </div>
            <div className='flex items-center gap-2'>
              <MapPin size={16} className='text-slate-400' />{" "}
              <span>{job.location}</span>
            </div>
            <div className='flex items-center gap-2'>
              <Calendar size={16} className='text-slate-400' />{" "}
              <span>Đăng ngày: {job.createdAt}</span>
            </div>
          </div>

          <button className='w-full py-2.5 bg-blue-50 text-blue-600 font-semibold rounded-xl hover:bg-blue-600 hover:text-white transition-colors'>
            <Link to={`/jobs/${job.id}`} className='block mt-4'>
              <button className='w-full py-2.5 bg-blue-50 text-blue-600 font-semibold rounded-xl hover:bg-blue-600 hover:text-white transition-colors'>
                Mở Kanban Board
              </button>
            </Link>
          </button>
        </div>
      ))}
    </div>
  );
}
