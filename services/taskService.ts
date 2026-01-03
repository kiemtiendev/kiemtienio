
import { BLOG_DESTINATION, TASK_RATES } from '../constants.tsx';

// Danh sách các Proxy hỗ trợ vượt CORS linh hoạt
const PROXIES = [
  (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}&timestamp=${Date.now()}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`
];

export const openTaskLink = async (taskId: number, userId: string, token: string) => {
  const task = TASK_RATES[taskId];
  if (!task) return;

  const dest = encodeURIComponent(`${BLOG_DESTINATION}?uid=${userId}&tid=${taskId}&key=${token}`);
  let apiUrl = "";
  
  switch(taskId) {
    case 1: apiUrl = `https://link4m.co/api-shorten/v2?api=${task.apiKey}&url=${dest}`; break;
    case 2: apiUrl = `https://yeulink.com/api?token=${task.apiKey}&url=${dest}`; break;
    case 3: apiUrl = `https://yeumoney.com/QL_api.php?token=${task.apiKey}&format=json&url=${dest}`; break;
    case 4: apiUrl = `https://xlink.co/api?token=${task.apiKey}&url=${dest}`; break;
    // FIX: Sử dụng endpoint chuẩn cho Traffictot
    case 5: apiUrl = `https://traffictot.com/api?api=${task.apiKey}&url=${dest}`; break;
    // FIX: Sử dụng endpoint chuẩn cho Laymanet
    case 6: apiUrl = `https://layma.net/api?api=${task.apiKey}&url=${dest}`; break;
  }

  if (!apiUrl) return;

  const newWindow = window.open('about:blank', '_blank');
  if (newWindow) {
    newWindow.document.write(`
      <body style="background:#03050a;color:#3b82f6;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
        <div style="border:4px solid #3b82f6;border-top-color:transparent;border-radius:50%;width:50px;height:50px;animation:s 1s linear infinite;"></div>
        <p style="margin-top:20px;font-weight:900;letter-spacing:2px;">NOVA SYNCING...</p>
        <style>@keyframes s{to{transform:rotate(360deg)}}</style>
      </body>
    `);
  }

  const fetchWithFallback = async (url: string) => {
    for (const proxyFn of PROXIES) {
      try {
        const response = await fetch(proxyFn(url));
        if (response.ok) {
          const json = await response.json();
          // AllOrigins returns data in 'contents' property, possibly as string
          const raw = json.contents || json;
          return typeof raw === 'string' ? raw : JSON.stringify(raw);
        }
      } catch (e) { continue; }
    }
    throw new Error("Không thể kết nối máy chủ rút gọn link.");
  };

  try {
    const content = await fetchWithFallback(apiUrl);
    let realLink = "";
    
    // Xử lý parse JSON linh hoạt cho nhiều định dạng API
    try {
      const data = JSON.parse(content);
      // Các trường phổ biến: shortenedUrl, url, link, short_link, hoặc data.shortenedUrl
      realLink = data.shortenedUrl || data.url || data.link || data.short_link || (data.data && data.data.shortenedUrl);
    } catch {
      // Fallback regex nếu API trả về text hoặc HTML chứa link
      const match = content.match(/https?:\/\/[^\s"'<>]+/);
      if (match) realLink = match[0];
    }

    if (realLink && realLink.startsWith('http') && newWindow) {
        newWindow.location.href = realLink;
    } else {
        console.error("API Response:", content);
        throw new Error("Link không hợp lệ hoặc API lỗi.");
    }
  } catch (err: any) {
    if (newWindow) newWindow.document.body.innerHTML = `<p style="color:red;text-align:center;padding:20px;">LỖI KẾT NỐI API: ${err.message}<br/>Vui lòng thử lại sau hoặc chọn cổng khác.</p>`;
  }
};
