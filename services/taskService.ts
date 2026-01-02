
import { BLOG_DESTINATION, TASK_RATES } from '../constants.tsx';

/**
 * Silent Redirect 11.0:
 * - Đối với TrafficTot: Trình duyệt tự xử lý redirect 302.
 * - Đối với các cổng JSON: Tự động bóc tách trường link rút gọn qua proxy.
 */
export const openTaskLink = async (taskId: number, userId: string, token: string) => {
  const task = TASK_RATES[taskId];
  if (!task) return;

  const dest = encodeURIComponent(`${BLOG_DESTINATION}?uid=${userId}&tid=${taskId}&key=${token}`);
  let apiUrl = "";
  let isDirectRedirect = false;

  switch(taskId) {
    case 1: apiUrl = `https://link4m.co/api-shorten/v2?api=${task.apiKey}&url=${dest}`; break;
    case 2: apiUrl = `https://yeulink.com/api?token=${task.apiKey}&url=${dest}`; break;
    case 3: apiUrl = `https://yeumoney.com/QL_api.php?token=${task.apiKey}&format=json&url=${dest}`; break;
    case 4: apiUrl = `https://xlink.co/api?token=${task.apiKey}&url=${dest}`; break;
    case 5: 
      apiUrl = `https://services.traffictot.com/api/v1/shorten/redirect?api_key=${task.apiKey}&url=${dest}`;
      isDirectRedirect = true;
      break;
    case 6: apiUrl = `https://api.layma.net/api/admin/shortlink/quicklink?tokenUser=${task.apiKey}&format=json&url=${dest}`; break;
  }

  if (!apiUrl) return;

  const newWindow = window.open('about:blank', '_blank');
  if (newWindow) {
    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nova Cloud Sync - Đang kết nối...</title>
        <style>
          body { background: #03050a; color: #3b82f6; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: 'Inter', sans-serif; overflow: hidden; }
          .loader { border: 4px solid rgba(59, 130, 246, 0.05); border-top: 4px solid #3b82f6; border-radius: 50%; width: 70px; height: 70px; animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite; margin-bottom: 30px; box-shadow: 0 0 30px rgba(59, 130, 246, 0.1); }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .text { text-transform: uppercase; font-weight: 900; font-style: italic; letter-spacing: 5px; font-size: 14px; text-shadow: 0 0 15px rgba(59, 130, 246, 0.4); animation: pulse 2s infinite; }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
          .sub-text { margin-top: 20px; color: #475569; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-align: center; max-width: 250px; line-height: 1.6; }
          .progress { width: 200px; height: 2px; background: rgba(255,255,255,0.05); margin-top: 30px; position: relative; overflow: hidden; border-radius: 10px; }
          .progress-bar { position: absolute; left: -100%; width: 100%; height: 100%; background: #3b82f6; animation: loading 2s infinite; }
          @keyframes loading { 0% { left: -100%; } 100% { left: 100%; } }
        </style>
      </head>
      <body>
        <div class="loader"></div>
        <div class="text">NOVA CLOUD SYNC</div>
        <div class="sub-text">ĐANG BÓC TÁCH LINK TỪ MÁY CHỦ ${task.name.toUpperCase()}...</div>
        <div class="progress"><div class="progress-bar"></div></div>
      </body>
      </html>
    `);
  }

  if (isDirectRedirect) {
    if (newWindow) newWindow.location.href = apiUrl;
    return;
  }

  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("Proxy failed");
    
    const proxyData = await response.json();
    if (!proxyData.contents) throw new Error("No data");
    
    let realLink = "";
    try {
      const data = JSON.parse(proxyData.contents);
      // Ưu tiên các trường link rút gọn chuẩn từ API các nhà cung cấp
      realLink = data.shortenedUrl || data.link || data.html || data.url || (data.data && (data.data.shortenedUrl || data.data.link || data.data.url));

      if (realLink && realLink.includes('<a href="')) {
        const match = realLink.match(/href="([^"]+)"/);
        if (match) realLink = match[1];
      }
    } catch (e) {
      if (proxyData.contents.trim().startsWith('http')) realLink = proxyData.contents.trim();
    }

    if (realLink && realLink.startsWith('http')) {
      if (newWindow) newWindow.location.href = realLink;
    } else {
      if (newWindow) newWindow.location.href = apiUrl;
    }
  } catch (error) {
    console.error("Link Extraction Failed:", error);
    if (newWindow) newWindow.location.href = apiUrl;
  }
};
