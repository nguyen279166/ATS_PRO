# Kế Hoạch Triển Khai - ATS System

## Overview
Hệ thống Quản lý Tuyển dụng (Applicant Tracking System - ATS).
Đây là phần mềm SaaS chuẩn B2B dành cho bộ phận HR để quản lý hồ sơ ứng viên, tracking quy trình phỏng vấn qua Kanban Board. Dự án này sẽ là cơ sở hoàn hảo để bạn show kỹ năng React + Typescript và chuẩn bị cho Fullstack sau này.

## Project Type
WEB

## Success Criteria
- Hệ thống chạy trơn tru, không có lỗi linter/type.
- Giao diện đẹp, chuyên nghiệp, chuẩn UI/UX doanh nghiệp.
- Code được tổ chức thành các component độc lập, tái sử dụng cao.
- Trải nghiệm Kanban Board thân thiện.

## Tech Stack
- **Core:** React 18 + Vite
- **Ngôn ngữ:** TypeScript (Strict Mode để quản lý data chặt chẽ)
- **Styling:** Tailwind CSS v4 (Mới nhất)
- **Icons:** `lucide-react`
- **Routing:** `react-router-dom` (Phiên bản 6)
- **State Management:** Sẽ bắt đầu với Context API/useState. (Nâng cấp `zustand` sau).
- **Forms:** Tính sau (Có thể tự làm custom hooks).

## File Structure (Kiến trúc dự kiến)
```text
src/
  ├── api/          # Config axios và định nghĩa các hàm gọi API giả (Mock)
  ├── components/   # UI components dùng chung (Button, Card, Badge)
  ├── features/     # Components chia theo nghiệp vụ lớn (ví dụ: kanban, jobs)
  ├── hooks/        # Custom hooks tái sử dụng (useDebounce, useLocalStorage)
  ├── layouts/      # Layout framework (MainLayout, Sidebar, Navbar)
  ├── pages/        # Tương ứng với các Route chính (Dashboard, Jobs, Settings)
  ├── types/        # Định nghĩa các TypeScript Interface (Job, Candidate)
  └── utils/        # Hàm trợ giúp (helper functions như format tiền, format ngày)
```

## Task Breakdown
1. **Khởi tạo & Cấu hình (P0) - `agent: frontend-specialist`**: Cấu hình TailwindCSS v4, làm sạch code mẫu của Vite. (Input: Clean codebase -> Output: Chạy `npm run dev` lên app sạch với setup css chuẩn).
2. **Thiết lập Core Types (P1) - `agent: frontend-specialist`**: Phân tích logic ứng viên và job, viết Typescript Interface.
3. **Cấu trúc Thư mục & Router (P1) - `agent: frontend-specialist`**: Cài react-router-dom, set up Navbar và Main Layout.
4. **Dashboard View (P2) - `agent: frontend-specialist`**: Làm vài component tĩnh hiển thị số liệu thống kê.
5. **Kanban Board Core (P2) - `agent: frontend-specialist`**: Hiển thị bảng kéo thả ứng viên.

## Phase X: Verification
- Chạy npm run lint không có cảnh báo nào.
- Giao diện Responsive trên nhiều màn hình.
- Phù hợp với mọi chuẩn mực thiết kế web của doanh nghiệp.
