
import { BLOG_DESTINATION, TASK_RATES } from '../constants.tsx';

/**
 * Silent Redirect 3.5 (Stable Tab Management):
 * - Sử dụng Proxy AllOrigins để lấy link rút gọn mà không lộ mã JSON thô.
 * - Bóc tách chính xác các trường: shortenedUrl, link, url, short_url.
 * - SỬ DỤNG window.open(url, '_blank') để bay sang TAB MỚI.
 * - Giữ nguyên tab web hiện tại cho người dùng.
 */
export const openTaskLink = async (taskId: number, userId: string, token: string) => {
  const task = TASK_RATES[taskId];
  if (!task) return;

  const dest = encodeURIComponent(`${BLOG_DESTINATION}?uid=${userId}&tid=${taskId}&key=${token}`);
  let apiUrl = "";

  // Xây dựng API URL theo chuẩn nhà mạng
  switch(taskId) {
    case 1: apiUrl = `https://link4m.co/api-shorten/v2?api=${task.apiKey}&url=${dest}`; break;
    case 2: apiUrl = `https://yeulink.com/api?token=${task.apiKey}&url=${dest}`; break;
    case 3: apiUrl = `https://yeumoney.com/QL_api.php?token=${task.apiKey}&format=json&url=${dest}`; break;
    case 4: apiUrl = `https://xlink.co/api?token=${task.apiKey}&url=${dest}`; break;
    case 5: apiUrl = `https://services.traffictot.com/api/v1/shorten?api=${task.apiKey}&url=${dest}`; break;
    case 6: apiUrl = `https://api.layma.net/api/admin/shortlink/quicklink?tokenUser=${task.apiKey}&format=json&url=${dest}`; break;
  }

  if (!apiUrl) return;

  // Sử dụng Proxy để gọi API ngầm
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("Cổng Proxy bận");
    
    const proxyData = await response.json();
    if (!proxyData.contents) throw new Error("Dữ liệu trống");
    
    const data = JSON.parse(proxyData.contents);

    // Bóc tách link theo các key của nhà mạng (Link4M: shortenedUrl, Others: link/url)
    const realLink = data.shortenedUrl || 
                     data.link || 
                     data.url || 
                     data.short_url || 
                     (data.data && data.data.shortenedUrl);

    if (realLink && typeof realLink === 'string' && realLink.startsWith('http')) {
      // MỞ TRONG TAB MỚI - GIỮ NGUYÊN WEB CHÍNH
      window.open(realLink, '_blank');
    } else {
      // DỰ PHÒNG: Mở API trực tiếp nếu không bóc tách được (vẫn mở tab mới)
      window.open(apiUrl, '_blank');
    }
  } catch (error) {
    console.warn("Lỗi chuyển hướng ngầm, chuyển sang mở trực tiếp:", error);
    window.open(apiUrl, '_blank');
  }
};
