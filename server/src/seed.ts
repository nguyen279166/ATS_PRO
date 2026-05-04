/**
 * Seed script: Tạo dữ liệu mẫu cho ATS System
 * Chạy bằng: npx ts-node src/seed.ts
 */
import prisma from "./prisma";

const jobs = [
  {
    title: "Frontend Developer (React/TypeScript)",
    department: "Engineering",
    location: "Hà Nội (Hybrid)",
    status: "Open",
    description: `VỀ VỊ TRÍ:
Chúng tôi đang tìm kiếm một Frontend Developer tài năng để gia nhập đội ngũ Engineering ngày càng phát triển. Bạn sẽ đóng vai trò quan trọng trong việc xây dựng các sản phẩm web hiện đại, đẹp mắt và hiệu năng cao.

TRÁCH NHIỆM:
• Phát triển và duy trì giao diện người dùng bằng React và TypeScript
• Phối hợp chặt chẽ với team Backend và Designer để hiện thực hóa các thiết kế UI/UX
• Tối ưu hóa hiệu năng ứng dụng (Core Web Vitals, lazy loading, code splitting)
• Viết unit test và tham gia code review

YÊU CẦU:
• Tối thiểu 1 năm kinh nghiệm với React
• Thành thạo TypeScript, HTML5, CSS3
• Hiểu biết về RESTful API và trải nghiệm làm việc với Git
• Ưu tiên ứng viên có kinh nghiệm với Tailwind CSS, Next.js

PHÚC LỢI:
• Lương thỏa thuận: 15 - 25 triệu VND/tháng
• Làm việc hybrid 3 ngày/tuần tại văn phòng
• Bảo hiểm sức khỏe cao cấp, nghỉ phép 15 ngày/năm
• Ngân sách học tập & phát triển cá nhân 5 triệu/năm`,
  },
  {
    title: "Backend Developer (Node.js/Prisma)",
    department: "Engineering",
    location: "TP. Hồ Chí Minh (Remote)",
    status: "Open",
    description: `VỀ VỊ TRÍ:
Bạn sẽ là người xây dựng và vận hành "bộ máy vô hình" của sản phẩm — nơi mọi nghiệp vụ quan trọng diễn ra. Đây là cơ hội để bạn làm việc với hệ thống backend hiện đại, scalable.

TRÁCH NHIỆM:
• Thiết kế và phát triển RESTful API với Node.js và Express
• Quản lý database PostgreSQL thông qua Prisma ORM
• Xây dựng cơ chế xác thực (JWT, OAuth) và phân quyền người dùng
• Tối ưu hóa query và thiết kế schema database

YÊU CẦU:
• 1+ năm kinh nghiệm với Node.js
• Kiến thức vững về SQL/PostgreSQL
• Hiểu biết về API security, rate limiting, data validation
• Biết Docker là một lợi thế lớn

PHÚC LỢI:
• Lương: 18 - 30 triệu VND/tháng
• Remote 100%, flexible working hours
• Trang bị laptop MacBook Pro M3
• Review lương 2 lần/năm`,
  },
  {
    title: "UI/UX Designer",
    department: "Design",
    location: "Hà Nội (Full-time tại văn phòng)",
    status: "Open",
    description: `VỀ VỊ TRÍ:
Chúng tôi tìm kiếm một UI/UX Designer sáng tạo, có con mắt thẩm mỹ tinh tế và khả năng biến ý tưởng thành sản phẩm mà người dùng thực sự yêu thích.

TRÁCH NHIỆM:
• Nghiên cứu người dùng (User Research, UX Interview) và phân tích dữ liệu
• Thiết kế wireframe, prototype và UI hoàn chỉnh trên Figma
• Xây dựng và duy trì Design System nhất quán
• Phối hợp với Developer để đảm bảo implementation đúng với thiết kế

YÊU CẦU:
• Thành thạo Figma, có thể làm việc với component-based design
• Hiểu biết về UX principles, accessibility (WCAG), responsive design
• Portfolio thể hiện ít nhất 3 dự án thực tế
• Biết cơ bản về HTML/CSS là lợi thế

PHÚC LỢI:
• Lương: 12 - 20 triệu VND/tháng
• Môi trường sáng tạo, được thử nghiệm ý tưởng
• Budget mua tools design (Figma Pro, fonts, icons...)`,
  },
  {
    title: "Product Manager",
    department: "Product",
    location: "Hà Nội (Hybrid)",
    status: "Open",
    description: `VỀ VỊ TRÍ:
Bạn sẽ là "người lái tàu" — người định hướng chiến lược sản phẩm, kết nối giữa business và engineering, đảm bảo team xây đúng thứ khách hàng cần.

TRÁCH NHIỆM:
• Định nghĩa product vision và roadmap theo từng quý
• Thu thập và phân tích yêu cầu từ stakeholders và người dùng
• Viết Product Requirements Document (PRD) rõ ràng, chi tiết
• Theo dõi metrics, phân tích data để đưa ra quyết định

YÊU CẦU:
• 2+ năm kinh nghiệm ở vị trí PM hoặc BA tại công ty tech
• Kỹ năng phân tích dữ liệu, biết dùng SQL cơ bản
• Tư duy user-centric, biết cách làm user story mapping
• Tiếng Anh giao tiếp tốt (đọc/viết tài liệu kỹ thuật)

PHÚC LỢI:
• Lương: 25 - 40 triệu VND/tháng + bonus theo KPI
• Cơ hội tham gia các quyết định chiến lược của công ty
• Ngân sách training & conference 10 triệu/năm`,
  },
  {
    title: "Data Analyst",
    department: "Data",
    location: "TP. Hồ Chí Minh (Hybrid)",
    status: "Open",
    description: `VỀ VỊ TRÍ:
Bạn sẽ biến những con số khô khan thành insight giúp công ty ra quyết định thông minh hơn. Đây là vị trí lý tưởng cho ai đam mê data và muốn tạo ra ảnh hưởng thực sự.

TRÁCH NHIỆM:
• Thu thập, làm sạch và phân tích dữ liệu từ nhiều nguồn
• Xây dựng dashboard và báo cáo tự động (Metabase, Looker Studio)
• Hỗ trợ các team khác đọc hiểu và sử dụng dữ liệu hiệu quả
• Phát hiện pattern, anomaly và đưa ra đề xuất cải thiện

YÊU CẦU:
• Thành thạo SQL (window functions, CTEs)
• Biết Python (pandas, matplotlib) hoặc R
• Kinh nghiệm với BI tools (Tableau, Power BI, Metabase)
• Kỹ năng storytelling with data tốt

PHÚC LỢI:
• Lương: 18 - 28 triệu VND/tháng
• Làm việc với data thực từ hàng triệu users
• Công ty hỗ trợ 100% phí học chứng chỉ liên quan`,
  },
  {
    title: "DevOps Engineer",
    department: "Infrastructure",
    location: "Remote (Toàn quốc)",
    status: "Open",
    description: `VỀ VỊ TRÍ:
Bạn sẽ là người đảm bảo hệ thống chạy 24/7 không gián đoạn, pipeline deploy mượt mà, và infrastructure luôn sẵn sàng scale khi traffic tăng đột biến.

TRÁCH NHIỆM:
• Quản lý và tối ưu CI/CD pipeline (GitHub Actions, GitLab CI)
• Deploy và monitor hạ tầng trên AWS/GCP
• Container hóa ứng dụng với Docker và Kubernetes
• Xây dựng hệ thống monitoring, alerting (Prometheus, Grafana)

YÊU CẦU:
• 2+ năm kinh nghiệm DevOps/SRE
• Thành thạo Linux, shell scripting
• Kinh nghiệm với Cloud services (AWS hoặc GCP)
• Hiểu biết về networking, security best practices

PHÚC LỢI:
• Lương: 25 - 45 triệu VND/tháng
• On-call allowance: 3 triệu/tháng
• Chứng chỉ AWS/GCP được công ty thanh toán 100%
• Remote full-time với meeting tối thiểu`,
  },
];

async function main() {
  console.log("🌱 Bắt đầu seed dữ liệu...");

  // Lấy user đầu tiên trong DB để gán làm owner
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) {
    console.error("❌ Không tìm thấy user nào trong DB. Hãy đăng ký tài khoản trước!");
    process.exit(1);
  }

  console.log(`👤 Sử dụng tài khoản: ${user.email} (${user.role})`);

  let created = 0;
  for (const job of jobs) {
    await prisma.job.create({
      data: { ...job, userId: user.id },
    });
    created++;
    console.log(`  ✅ Tạo job: ${job.title}`);
  }

  console.log(`\n🎉 Hoàn tất! Đã tạo ${created} jobs mới.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
