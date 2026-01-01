
import { BLOG_DESTINATION, TASK_RATES } from '../constants.tsx';

/**
 * Silent Mining Redirect 2.0:
 * 1. Gọi API nhà mạng thông qua Proxy (allorigins.win) để vượt rào cản CORS.
 * 2. Phân tích nội dung JSON trả về để trích xuất link rút gọn thực tế.
 * 3. Tự động chuyển hướng (Redirect) người dùng đến link đích ngay lập tức.
 * 
 * Mục tiêu: Loại bỏ hoàn toàn màn hình JSON đen/trắng gây khó chịu cho người dùng.
 */
export const openTaskLink = async (taskId: number, userId: string, token: string) => {
  const task = TASK_RATES[taskId];
  if (!task) return;

  const dest = encodeURIComponent(`${BLOG_DESTINATION}?uid=${userId}&tid=${taskId}&key=${token}`);
  let apiUrl = "";

  // Xây dựng API URL chính xác cho từng nhà mạng dựa trên ID
  switch(taskId) {
    case 1: // LINK4M
      apiUrl = `https://link4m.co/api-shorten/v2?api=${task.apiKey}&url=${dest}`; 
      break;
    case 2: // YEULINK
      apiUrl = `https://yeulink.com/api?token=${task.apiKey}&url=${dest}`; 
      break;
    case 3: // YEUMONEY
      apiUrl = `https://yeumoney.com/QL_api.php?token=${task.apiKey}&format=json&url=${dest}`; 
      break;
    case 4: // XLINK
      apiUrl = `https://xlink.co/api?token=${task.apiKey}&url=${dest}`; 
      break;
    case 5: // TRAFFICTOT
      apiUrl = `https://services.traffictot.com/api/v1/shorten?api=${task.apiKey}&url=${dest}`; 
      break;
    case 6: // LAYMANET
      apiUrl = `https://api.layma.net/api/admin/shortlink/quicklink?tokenUser=${task.apiKey}&format=json&url=${dest}`; 
      break;
  }

  if (!apiUrl) return;

  // SỬ DỤNG PROXY ĐỂ FIX TRIỆT ĐỂ LỖI HIỆN JSON VÀ CORS
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;

  try {
    // 1. Gọi API thông qua Proxy để lấy nội dung mà không bị trình duyệt chặn
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("Proxy error");
    
    const proxyData = await response.json();
    
    // 2. Parse (phân tích) nội dung JSON nằm bên trong field contents của proxy
    const data = JSON.parse(proxyData.contents);

    // 3. Bóc tách link theo các key phổ biến của các nhà mạng rút gọn
    // Quét tất cả các khả năng: shortenedUrl, html, link, url, short_url...
    const realLink = data.shortenedUrl || data.html || data.link || data.url || data.short_url || (data.data && data.data.shortenedUrl);

    if (realLink) {
      // THÀNH CÔNG: Chuyển hướng ngay lập tức (Replace để không bị loop nút Back)
      window.location.replace(realLink);
    } else {
      // DỰ PHÒNG: Nếu bóc tách JSON không thấy link, mở link API gốc
      window.location.href = apiUrl;
    }
  } catch (error) {
    // LỖI: Nếu proxy hoặc fetch thất bại, mở link API trực tiếp làm fallback cuối cùng
    console.error("Lỗi xác thực Mining Node:", error);
    window.location.href = apiUrl;
  }
};
