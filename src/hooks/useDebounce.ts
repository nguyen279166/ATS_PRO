import { useState, useEffect } from "react";

// Custom hook này nhận vào giá trị user đang gõ, và thời gian chờ (delay)
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Kích hoạt đồng hồ bấm giờ
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Dọn dẹp: Nếu user lại gõ phím trước khi hết thời gian chờ,
    // hàm cleanup này sẽ Đập vỡ đồng hồ cũ, bắt đầu tính giờ lại từ đầu.
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue; // Trả về giá trị đã "chín"
}
