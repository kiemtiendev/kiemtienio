
import { BLOG_DESTINATION } from '../constants.tsx';

const TASK_APIS = {
  1: (api: string, dest: string) => `https://link4m.co/api-shorten/v2?api=${api}&url=${dest}`,
  2: (api: string, dest: string) => `https://yeulink.com/api?token=${api}&url=${dest}`,
  3: (api: string, dest: string) => `https://yeumoney.com/QL_api.php?token=${api}&format=json&url=${dest}`,
  4: (api: string, dest: string) => `https://xlink.co/api?token=${api}&url=${dest}`,
  5: (api: string, dest: string) => `https://services.traffictot.com/api/v1/shorten?api=${api}&url=${dest}`,
  6: (api: string, dest: string) => `https://api.layma.net/api/admin/shortlink/quicklink?tokenUser=${api}&format=json&url=${dest}`
};

export const getShortLink = async (taskId: number, apiKey: string, userId: string, token: string) => {
  const apiFunc = TASK_APIS[taskId as keyof typeof TASK_APIS];
  if (!apiFunc) return null;

  const destination = encodeURIComponent(`${BLOG_DESTINATION}?uid=${userId}&tid=${taskId}&key=${token}`);
  const apiUrl = apiFunc(apiKey, destination);

  try {
    // Lưu ý: Đa số các API rút gọn link yêu cầu gọi từ Server-side do CORS.
    // Trong môi trường No-build Client-side này, ta sẽ trả về link Quicklink nếu fetch thất bại hoặc CORS.
    // Một số bên như Link4M cho phép gọi trực tiếp hoặc dùng proxy.
    const response = await fetch(apiUrl).catch(() => null);
    if (response && response.ok) {
      const data = await response.json();
      return data.shortenedUrl || data.shortLink || data.url || null;
    }
    
    // Fallback: Trả về link API trực tiếp để trình duyệt xử lý redirect nếu Fetch bị CORS
    return apiUrl;
  } catch (error) {
    return apiUrl; 
  }
};
