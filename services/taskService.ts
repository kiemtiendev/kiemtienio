
import { BLOG_DESTINATION, TASK_RATES } from '../constants.tsx';

/**
 * Silent Redirect 4.0:
 * - Cải thiện khả năng bóc tách JSON cho LayMaNet (trường html).
 * - Sử dụng cơ chế mở tab mới an toàn.
 */
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
    case 5: apiUrl = `https://services.traffictot.com/api/v1/shorten?api=${task.apiKey}&url=${dest}`; break;
    case 6: apiUrl = `https://api.layma.net/api/admin/shortlink/quicklink?tokenUser=${task.apiKey}&format=json&url=${dest}`; break;
  }

  if (!apiUrl) return;

  // Gọi API thông qua Proxy
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("Proxy error");
    
    const proxyData = await response.json();
    const data = JSON.parse(proxyData.contents);

    // Bóc tách link từ nhiều nguồn tiềm năng
    const realLink = data.html || 
                     data.shortenedUrl || 
                     data.link || 
                     data.url || 
                     data.short_url || 
                     (data.data && (data.data.shortenedUrl || data.data.short_url || data.data.link || data.data.html));

    if (realLink && typeof realLink === 'string' && realLink.startsWith('http')) {
      window.open(realLink, '_blank');
    } else {
      // Nếu bóc tách JSON thất bại nhưng API thành công, thử mở trực tiếp apiUrl
      window.open(apiUrl, '_blank');
    }
  } catch (error) {
    console.warn("API redirect failed, opening direct URL:", error);
    window.open(apiUrl, '_blank');
  }
};
