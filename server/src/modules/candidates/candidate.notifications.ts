export type CandidateStatusEmail = {
  subject: string;
  html: string;
};

export const buildCandidateStatusEmail = (
  status: string,
  name: string,
  jobTitle: string,
  department: string,
): CandidateStatusEmail | null => {
  const footer =
    '<br/><p style="color:#64748b;font-size:13px">Trân trọng,<br/><strong>Bộ phận Tuyển dụng – ATSPRO</strong></p>';

  const templates: Record<string, CandidateStatusEmail> = {
    Interviewing: {
      subject: "📅 Thư mời phỏng vấn – " + jobTitle,
      html: [
        '<h2 style="color:#1e40af">📅 Thư mời phỏng vấn</h2>',
        "             <p>Chào <strong>" + name + "</strong>,</p>",
        "             <p>Chúng tôi đã xem xét hồ sơ của bạn cho vị trí <strong>" +
          jobTitle +
          "</strong> tại phòng <strong>" +
          department +
          "</strong> và rất vui mừng được mời bạn tham gia vòng phỏng vấn.</p>",
        "             <p>Bộ phận nhân sự sẽ sớm liên hệ để sắp xếp lịch phỏng vấn cụ thể. Vui lòng chuẩn bị sẵn hồ sơ và các giấy tờ cần thiết.</p>",
        "             " + footer,
      ].join("\n"),
    },
    Hired: {
      subject: "🎉 Chúc mừng! Bạn đã trúng tuyển vị trí " + jobTitle,
      html: [
        '<h2 style="color:#065f46">🎉 Chúc mừng trúng tuyển!</h2>',
        "             <p>Chào <strong>" + name + "</strong>,</p>",
        "             <p>Chúng tôi rất vui mừng thông báo bạn đã chính thức <strong>trúng tuyển</strong> vị trí <strong>" +
          jobTitle +
          "</strong> tại phòng <strong>" +
          department +
          "</strong>.</p>",
        "             <p>Bộ phận nhân sự sẽ liên hệ với bạn trong thời gian sớm nhất để trao đổi về offer và lịch nhận việc.</p>",
        "             " + footer,
      ].join("\n"),
    },
    Rejected: {
      subject: "Thư cảm ơn – Vị trí " + jobTitle,
      html: [
        '<h2 style="color:#374151">Thư cảm ơn</h2>',
        "             <p>Chào <strong>" + name + "</strong>,</p>",
        "             <p>Cảm ơn bạn đã dành thời gian ứng tuyển vị trí <strong>" +
          jobTitle +
          "</strong> tại phòng <strong>" +
          department +
          "</strong>.</p>",
        "             <p>Sau quá trình xem xét kỹ lưỡng, chúng tôi đã tìm được ứng viên phù hợp hơn với nhu cầu hiện tại. Chúng tôi sẽ lưu hồ sơ của bạn và liên hệ khi có cơ hội phù hợp.</p>",
        "             <p>Chúc bạn nhiều thành công!</p>",
        "             " + footer,
      ].join("\n"),
    },
  };

  return templates[status] ?? null;
};
