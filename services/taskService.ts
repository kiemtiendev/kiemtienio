
import { BLOG_DESTINATION, TASK_RATES } from '../constants.tsx';

/**
 * Hàm mở link nhiệm vụ. 
 * Thay vì fetch (bị lỗi CORS), chúng ta mở cửa sổ mới để trình duyệt xử lý redirect của API nhà cung cấp.
 */
export const openTaskLink = (taskId: number, userId: string, token: string) => {
  const task = TASK_RATES[taskId];
  if (!task) return;

  const dest = encodeURIComponent(`${BLOG_DESTINATION}?uid=${userId}&tid=${taskId}&key=${token}`);
  let apiUrl = "";

  // Cấu hình URL gọi nhanh cho từng nhà cung cấp dựa trên API Key
  switch(taskId) {
    case 1: 
      apiUrl = `https://link4m.co/api-shorten/v2?api=${task.apiKey}&url=${dest}`; 
      break;
    case 2: 
      apiUrl = `https://yeulink.com/api?token=${task.apiKey}&url=${dest}`; 
      break;
    case 3: 
      apiUrl = `https://yeumoney.com/QL_api.php?token=${task.apiKey}&format=json&url=${dest}`; 
      break;
    case 4: 
      apiUrl = `https://xlink.co/api?token=${task.apiKey}&url=${dest}`; 
      break;
    case 5: 
      apiUrl = `https://services.traffictot.com/api/v1/shorten?api=${task.apiKey}&url=${dest}`; 
      break;
    case 6: 
      apiUrl = `https://api.layma.net/api/admin/shortlink/quicklink?tokenUser=${task.apiKey}&format=json&url=${dest}`; 
      break;
  }

  // Mở tab mới để vượt link
  if (apiUrl) {
    window.open(apiUrl, "_blank");
  }
};
