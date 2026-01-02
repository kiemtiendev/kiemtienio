
import { BLOG_DESTINATION, TASK_RATES } from '../constants.tsx';

/**
 * Nova Cloud Link Extractor v12.6:
 * - Multi-proxy fallback (AllOrigins -> CorsProxy.io).
 * - Tối ưu hóa đặc biệt cho LAYMANET và các cổng JSON.
 * - Xử lý lỗi "Failed to fetch" bằng cơ chế retry tự động.
 */

// Danh sách các Proxy hỗ trợ vượt CORS
const PROXIES = [
  (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}&timestamp=${Date.now()}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`
];

export const openTaskLink = async (taskId: number, userId: string, token: string) => {
  const task = TASK_RATES[taskId];
  if (!task) return;

  const dest = encodeURIComponent(`${BLOG_DESTINATION}?uid=${userId}&tid=${taskId}&key=${token}`);
  let apiUrl = "";
  let isDirectRedirect = false;
  let preferredFormat = "json";

  // Cấu hình API Endpoint theo từng cổng
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
      apiUrl = `https://services.traffictot.com/api/v1/shorten/redirect?api_key=${task.apiKey}&url=${dest}`;
      isDirectRedirect = true;
      break;
    case 6: // LAYMANET
      apiUrl = `https://api.layma.net/api/admin/shortlink/quicklink?tokenUser=${task.apiKey}&format=json&url=${dest}&link_du_phong=${encodeURIComponent(BLOG_DESTINATION)}`; 
      preferredFormat = "json";
      break;
  }

  if (!apiUrl) return;

  // Mở cửa sổ trung gian ngay lập tức để tránh bị Pop-up blocker chặn
  const newWindow = window.open('about:blank', '_blank');
  if (newWindow) {
    newWindow.document.write(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>Nova Cloud Sync - Đang kết nối...</title>
        <style>
          body { background: #03050a; color: #3b82f6; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: 'Inter', sans-serif; overflow: hidden; }
          .loader { border: 4px solid rgba(59, 130, 246, 0.05); border-top: 4px solid #3b82f6; border-radius: 50%; width: 80px; height: 80px; animation: spin 1s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .text { margin-top: 30px; font-weight: 900; font-style: italic; letter-spacing: 4px; font-size: 14px; text-transform: uppercase; }
          .sub { color: #64748b; font-size: 10px; margin-top: 10px; text-align: center; max-width: 250px; }
          .error { display: none; margin-top: 20px; color: #ef4444; font-size: 11px; background: rgba(239, 68, 68, 0.1); padding: 10px 20px; border-radius: 10px; border: 1px solid rgba(239, 68, 68, 0.2); text-align: center; }
        </style>
      </head>
      <body>
        <div class="loader"></div>
        <div class="text">NOVA SYNC</div>
        <div id="status" class="sub">ĐANG THIẾT LẬP KẾT NỐI AN TOÀN ĐẾN ${task.name}...</div>
        <div id="error" class="error">LỖI: KHÔNG THỂ KẾT NỐI VỚI MÁY CHỦ QUẢNG CÁO.</div>
      </body>
      </html>
    `);
  }

  if (isDirectRedirect) {
    if (newWindow) newWindow.location.href = apiUrl;
    return;
  }

  /**
   * Hàm thực hiện Fetch qua Proxy với cơ chế Fallback
   */
  const fetchWithFallback = async (url: string) => {
    let lastError = null;

    for (let i = 0; i < PROXIES.length; i++) {
      try {
        const proxyUrl = PROXIES[i](url);
        console.log(`Nova Sync: Attempting via Proxy ${i + 1}...`);
        
        const response = await fetch(proxyUrl, { method: 'GET' });
        if (!response.ok) throw new Error(`Proxy ${i + 1} returned ${response.status}`);
        
        const result = await response.json();
        
        // Xử lý dữ liệu trả về từ AllOrigins (result.contents) hoặc các proxy trực tiếp khác
        const content = result.contents !== undefined ? result.contents : JSON.stringify(result);
        if (!content) throw new Error("Empty response content");
        
        return content;
      } catch (err) {
        console.warn(`Nova Sync: Proxy ${i + 1} failed:`, err);
        lastError = err;
      }
    }
    throw lastError || new Error("All proxies failed");
  };

  try {
    const rawContent = await fetchWithFallback(apiUrl);
    const cleanContent = rawContent.trim();
    let realLink = "";

    // Giai đoạn trích xuất Link
    if (preferredFormat === "text" && cleanContent.startsWith('http')) {
      realLink = cleanContent;
    } else {
      try {
        const data = JSON.parse(cleanContent);
        // Trích xuất từ các cấu trúc JSON phổ biến
        realLink = 
          data.shortenedUrl || 
          data.shortlink || 
          data.url || 
          data.link || 
          (data.data && (data.data.shortenedUrl || data.data.shortlink || data.data.url || data.data.link)) ||
          (data.result && (data.result.shortenedUrl || data.result.shortlink));
      } catch (e) {
        // Fallback: Tìm bằng Regex
        const urlMatch = cleanContent.match(/https?:\/\/[^\s"'<>]+/);
        if (urlMatch) realLink = urlMatch[0];
      }
    }

    if (realLink) {
        realLink = realLink.replace(/["']/g, '');
    }

    // Kiểm tra tính hợp lệ và chuyển hướng
    if (realLink && realLink.startsWith('http') && !realLink.includes('api-shorten') && !realLink.includes('quicklink')) {
      console.log("Nova Sync: Link extracted successfully ->", realLink);
      if (newWindow) {
        newWindow.location.href = realLink;
      }
    } else {
      throw new Error("Could not find a valid shortlink in the response");
    }
  } catch (error: any) {
    console.error("Nova Sync Ultimate Error:", error);
    if (newWindow) {
      const statusEl = newWindow.document.getElementById('status');
      const errorEl = newWindow.document.getElementById('error');
      if (statusEl) statusEl.innerText = "KẾT NỐI BỊ GIÁN ĐOẠN.";
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.innerText = `LỖI ĐỒNG BỘ: ${error.message || "Failed to fetch"}. Vui lòng thử lại hoặc tắt trình chặn quảng cáo.`;
      }
    }
  }
};
