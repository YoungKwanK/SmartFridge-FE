import axios from 'axios';

// 영수증·주문내역 사진 인식 API. 인증 헤더와 토큰 갱신은 plugins/axios.js의 전역 인터셉터가 맡는다.
// 인식 결과는 저장되지 않는다. 사용자가 확인한 뒤 기존 식품 등록 API로 등록한다.

// 서버가 받는 최대 크기는 5MB. 긴 변 1600px JPEG 로 줄이면 보통 1MB 아래라 글자도 충분히 읽힌다
const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.85;

// 사진을 긴 변 1600px JPEG 로 줄인다. 아이폰 HEIC 사진도 여기서 JPEG 가 되고, 세로 사진 회전도 맞춘다
export async function resizeImage(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!blob) {
      throw new Error('사진을 변환하지 못했어요.');
    }
    return blob;
  } finally {
    bitmap.close();
  }
}

export const receiptService = {
  // 사진 한 장 인식 → { sourceType, foods: [...], note }
  // foods 의 앞 필드(name, quantity, storageType, category, expirationDate, shareable)는 등록 API 형식과 같고,
  // rawName, orderQuantity, packCount, amount, purchaseDate, shelfLifeDays 는 확인 화면 참고용이다
  async recognize(fridgeId, file) {
    const image = await resizeImage(file);
    const form = new FormData();
    form.append('image', image, 'receipt.jpg');
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/food/receipt`,
      form
    );
    return response.data.result;
  }
};

export default receiptService;
