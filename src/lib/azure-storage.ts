import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'product-images';

/**
 * Blob Service Client 가져오기 (lazy initialization)
 */
function getBlobServiceClient(): BlobServiceClient {
  if (!connectionString || connectionString.trim() === '') {
    throw new Error('Azure Storage connection string이 설정되지 않았습니다. .env.local 파일을 확인하세요.');
  }
  
  // Connection String 형식 검증
  if (!connectionString.includes('AccountName=') || !connectionString.includes('AccountKey=')) {
    throw new Error('Azure Storage connection string 형식이 잘못되었습니다. DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=... 형식이어야 합니다.');
  }
  
  try {
    return BlobServiceClient.fromConnectionString(connectionString);
  } catch (error) {
    console.error('Azure Blob Storage 초기화 실패:', error);
    throw new Error(`Azure Blob Storage 연결 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Container Client 가져오기
 */
function getContainerClient(): ContainerClient {
  const blobServiceClient = getBlobServiceClient();
  return blobServiceClient.getContainerClient(containerName);
}

/**
 * Base64 이미지를 Azure Blob Storage에 업로드
 * @param base64Data - Base64 인코딩된 이미지 데이터 (data:image/jpeg;base64,... 형식)
 * @param fileName - 저장할 파일명 (확장자 포함)
 * @returns 업로드된 이미지의 URL
 */
export async function uploadImageToBlob(
  base64Data: string,
  fileName: string
): Promise<string> {
  try {
    console.log('🔵 uploadImageToBlob 시작');
    console.log('📝 fileName:', fileName);
    console.log('📝 base64Data length:', base64Data.length);
    
    // Base64 데이터에서 실제 데이터 부분만 추출
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      throw new Error('유효하지 않은 Base64 데이터입니다.');
    }

    const contentType = matches[1]; // 예: image/jpeg
    const base64Content = matches[2];
    
    console.log('📝 contentType:', contentType);
    console.log('📝 base64Content length:', base64Content.length);
    
    // Base64를 Buffer로 변환
    const buffer = Buffer.from(base64Content, 'base64');
    console.log('📝 buffer size:', buffer.length, 'bytes');
    
    // 고유한 파일명 생성 (타임스탬프 + 랜덤 문자열)
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const uniqueFileName = `${timestamp}-${randomString}-${fileName}`;
    
    console.log('📝 uniqueFileName:', uniqueFileName);
    
    // Container Client 가져오기
    console.log('🔵 Container Client 가져오기...');
    const containerClient = getContainerClient();
    
    // Blob 클라이언트 생성
    const blockBlobClient = containerClient.getBlockBlobClient(uniqueFileName);
    console.log('📍 업로드 대상 URL:', blockBlobClient.url);
    
    // 업로드
    console.log('📤 Azure Blob 업로드 중...');
    const uploadResult = await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: contentType,
      },
    });
    
    console.log('✅ 업로드 성공!');
    console.log('📍 uploadResult:', uploadResult);
    
    // 업로드된 이미지의 URL 반환
    const finalUrl = blockBlobClient.url;
    console.log('📍 최종 URL:', finalUrl);
    
    return finalUrl;
  } catch (error) {
    console.error('❌ 이미지 업로드 실패 상세:', error);
    console.error('에러 타입:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('에러 메시지:', error instanceof Error ? error.message : error);
    throw new Error(`이미지 업로드에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Azure Blob Storage에서 이미지 삭제
 * @param imageUrl - 삭제할 이미지 URL
 */
export async function deleteImageFromBlob(imageUrl: string): Promise<void> {
  try {
    // URL에서 Blob 이름 추출
    const url = new URL(imageUrl);
    const blobName = url.pathname.split('/').pop();
    
    if (!blobName) {
      throw new Error('유효하지 않은 이미지 URL입니다.');
    }
    
    const containerClient = getContainerClient();
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists();
  } catch (error) {
    console.error('이미지 삭제 실패:', error);
    // 삭제 실패는 치명적이지 않으므로 에러를 던지지 않음
  }
}

/**
 * 파일명에서 확장자 추출
 * @param base64Data - Base64 데이터
 * @returns 파일 확장자 (예: .jpg, .png)
 */
export function getImageExtension(base64Data: string): string {
  const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,/);
  
  if (matches && matches[1]) {
    return `.${matches[1]}`;
  }
  
  return '.jpg'; // 기본값
}


