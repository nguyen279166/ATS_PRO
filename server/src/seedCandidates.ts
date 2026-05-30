/**
 * Seed candidates: Tạo nhiều ứng viên mẫu để test pagination
 * Chạy bằng: npx tsx src/seedCandidates.ts
 */
import prisma from "./prisma";

const statuses = ["Applied", "Interviewing", "Hired", "Rejected"] as const;

const candidateNames = [
  "Nguyễn Văn An", "Trần Thị Bình", "Lê Hoàng Cường", "Phạm Thị Dung",
  "Hoàng Văn Em", "Vũ Thị Phương", "Đặng Minh Giang", "Bùi Thị Hoa",
  "Ngô Văn Hùng", "Dương Thị Lan", "Lý Văn Khánh", "Phan Thị Mai",
  "Trương Văn Nam", "Đinh Thị Oanh", "Hồ Văn Phong", "Lương Thị Quỳnh",
  "Tống Văn Sơn", "Nghiêm Thị Thu", "Đoàn Văn Uy", "Mai Thị Vân",
  "Cao Văn Xuân", "Lê Thị Yến", "Nguyễn Minh Tuấn", "Trần Hoàng Long",
  "Phạm Văn Đức", "Vũ Thị Hạnh", "Đặng Văn Kiên", "Bùi Minh Khoa",
  "Ngô Thị Linh", "Dương Văn Mạnh",
];

async function main() {
  console.log("🌱 Bắt đầu seed candidates...");

  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) {
    console.error("❌ Không tìm thấy user nào. Hãy đăng ký tài khoản trước!");
    process.exit(1);
  }

  const jobs = await prisma.job.findMany({ take: 6 });
  if (jobs.length === 0) {
    console.error("❌ Không tìm thấy job nào. Chạy seed jobs trước!");
    process.exit(1);
  }

  console.log(`👤 User: ${user.email} | 💼 Có ${jobs.length} jobs`);

  let created = 0;
  for (let i = 0; i < candidateNames.length; i++) {
    const name = candidateNames[i];
    const job = jobs[i % jobs.length]; // Phân đều vào các jobs
    const status = statuses[i % statuses.length];
    const emailName = name.toLowerCase()
      .replace(/\s+/g, ".")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");

    await prisma.candidate.create({
      data: {
        name,
        email: `${emailName}${i + 1}@example.com`,
        status,
        jobId: job.id,
        avatar: `https://i.pravatar.cc/150?u=${emailName}${i}`,
        appliedDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Mỗi người cách nhau 1 ngày
      },
    });
    created++;
    console.log(`  ✅ [${i + 1}/${candidateNames.length}] ${name} → ${job.title} (${status})`);
  }

  const total = await prisma.candidate.count();
  console.log(`\n🎉 Hoàn tất! Tạo ${created} candidates. Tổng: ${total} ứng viên trong DB.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
