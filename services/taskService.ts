
import { BLOG_DESTINATION, TASK_RATES } from '../constants.tsx';

/**
 * Nova Cloud Link Extractor v12.0:
 * - Tự động bóc tách link rút gọn từ JSON API của 6 nhà cung cấp.
 * - Đảm bảo mở trực tiếp link rút gọn (e.g., https://link4m.com/...) 
 * - Tuyệt đối không để lộ link API hoặc nội dung JSON cho người dùng.
 */
export const openTaskLink = async (taskId: number, userId: string, token: string) => {
  const task = TASK_RATES[taskId];
  if (!task) return;

  const dest = encodeURIComponent(`${BLOG_DESTINATION}?uid=${userId}&tid=${taskId}&key=${token}`);
  let apiUrl = "";
  let isDirectRedirect = false;

  // Cấu hình API Endpoint cho từng cổng
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
      apiUrl = `https://api.layma.net/api/admin/shortlink/quicklink?tokenUser=${task.apiKey}&format=json&url=${dest}`; 
      break;
  }

  if (!apiUrl) return;

  // Bước 1: Mở cửa sổ trung gian với hiệu ứng Nova Loader để tránh Popup Blocker
  const newWindow = window.open('about:blank', '_blank');
  if (newWindow) {
    newWindow.document.write(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>Nova Cloud Sync - Đang kết nối...</title>
        <style>
          body { background: #03050a; color: #3b82f6; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: 'Inter', -apple-system, sans-serif; overflow: hidden; }
          .loader-container { position: relative; width: 100px; height: 100px; }
          .loader { border: 4px solid rgba(59, 130, 246, 0.05); border-top: 4px solid #3b82f6; border-radius: 50%; width: 100%; height: 100%; animation: spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite; }
          .inner-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; background: #3b82f6; border-radius: 50%; filter: blur(20px); opacity: 0.3; animation: pulse 2s infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes pulse { 0%, 100% { opacity: 0.2; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.5); } }
          .text { margin-top: 40px; text-transform: uppercase; font-weight: 900; font-style: italic; letter-spacing: 6px; font-size: 16px; text-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
          .sub-text { margin-top: 15px; color: #64748b; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-align: center; max-width: 300px; line-height: 1.6; }
          .progress { width: 240px; height: 3px; background: rgba(255,255,255,0.03); margin-top: 40px; position: relative; overflow: hidden; border-radius: 10px; }
          .progress-bar { position: absolute; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, #3b82f6, transparent); animation: loading 1.5s infinite; }
          @keyframes loading { 0% { left: -100%; } 100% { left: 100%; } }
          .error-msg { display: none; margin-top: 30px; color: #ef4444; font-size: 12px; font-weight: 900; background: rgba(239, 68, 68, 0.1); padding: 15px 30px; border-radius: 15px; border: 1px solid rgba(239, 68, 68, 0.2); }
        </style>
      </head>
      <body>
        <div class="loader-container">
          <div class="loader"></div>
          <div class="inner-glow"></div>
        </div>
        <div class="text">NOVA SYNC</div>
        <div id="status" class="sub-text">ĐANG KHỞI TẠO LIÊN KẾT TỪ MÁY CHỦ ${task.name}...</div>
        <div class="progress"><div class="progress-bar"></div></div>
        <div id="error" class="error-msg">LỖI KẾT NỐI API! VUI LÒNG THỬ LẠI.</div>
      </body>
      </html>
    `);
  }

  // Nếu là TrafficTot, trình duyệt tự xử lý redirect 302, không cần bóc JSON
  if (isDirectRedirect) {
    if (newWindow) newWindow.location.href = apiUrl;
    return;
  }

  // Sử dụng AllOrigins Proxy để vượt CORS và đọc JSON từ phía Client
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("CORS Proxy error");
    
    const proxyData = await response.json();
    if (!proxyData.contents) throw new Error("API returned no content");
    
    let realLink = "";
    try {
      const data = JSON.parse(proxyData.contents);
      
      // LOGIC BÓC TÁCH CHUYÊN SÂU CHO CẢ 6 CỔNG (Dựa trên phản hồi thực tế của các API rút gọn link)
      // Các trường phổ biến: shortenedUrl (Link4M), shortlink (YeuLink), url (LayMaNet), link (YeuMoney)
      realLink = 
        data.shortenedUrl || 
        data.shortlink || 
        data.link || 
        data.url || 
        (data.data && (data.data.shortenedUrl || data.data.shortlink || data.data.link || data.data.url)) ||
        (data.result && (data.result.shortenedUrl || data.result.shortlink));

      // Trường hợp API trả về mã HTML có chứa thẻ <a>
      if (realLink && realLink.includes('<a href="')) {
        const match = realLink.match(/href="([^"]+)"/);
        if (match) realLink = match[1];
      }
    } catch (e) {
      // Nếu API trả về chuỗi text thuần là link
      if (proxyData.contents.trim().startsWith('http')) {
        realLink = proxyData.contents.trim();
      }
    }

    // CHỈ CHUYỂN HƯỚNG NẾU LẤY ĐƯỢC LINK RÚT GỌN THỰC SỰ
    if (realLink && realLink.startsWith('http') && !realLink.includes('api-shorten') && !realLink.includes('QL_api')) {
      if (newWindow) {
        newWindow.location.href = realLink;
      }
    } else {
      // Nếu bóc tách thất bại, hiển thị thông báo lỗi thay vì hiển thị JSON cho người dùng
      if (newWindow) {
        newWindow.document.getElementById('status')!.innerText = "KHÔNG THỂ TRÍCH XUẤT LIÊN KẾT.";
        newWindow.document.getElementById('error')!.style.display = 'block';
      }
    }
  } catch (error) {
    console.error("Nova Sync Failed:", error);
    // Fallback an toàn: Nếu lỗi proxy nhưng vẫn muốn thử vận may mở link gốc
    if (newWindow) {
      newWindow.document.getElementById('status')!.innerText = "LỖI ĐỒNG BỘ NOVA CLOUD.";
      newWindow.document.getElementById('error')!.style.display = 'block';
    }
  }
};
