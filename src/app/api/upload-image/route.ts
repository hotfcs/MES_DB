import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToBlob, getImageExtension } from '@/lib/azure-storage';

export async function POST(request: NextRequest) {
  try {
    console.log('📸 이미지 업로드 API 호출됨');
    
    const body = await request.json();
    const { image, fileName } = body;
    
    console.log('📝 fileName:', fileName);
    console.log('📝 image length:', image?.length || 0);
    console.log('📝 Connection String 존재:', !!process.env.AZURE_STORAGE_CONNECTION_STRING);
    console.log('📝 Container Name:', process.env.AZURE_STORAGE_CONTAINER_NAME);

    if (!image) {
      console.error('❌ 이미지 데이터가 없습니다');
      return NextResponse.json(
        { success: false, message: '이미지 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    // Base64 이미지 여부 확인
    if (!image.startsWith('data:image/')) {
      console.error('❌ 유효하지 않은 이미지 형식');
      return NextResponse.json(
        { success: false, message: '유효하지 않은 이미지 형식입니다.' },
        { status: 400 }
      );
    }

    // 파일명 생성 (제공되지 않은 경우)
    const extension = getImageExtension(image);
    const finalFileName = fileName || `image${extension}`;
    
    console.log('📤 Azure Blob Storage 업로드 시작...');
    console.log('📝 최종 파일명:', finalFileName);

    // Azure Blob Storage에 업로드
    const imageUrl = await uploadImageToBlob(image, finalFileName);
    
    console.log('✅ 업로드 성공!');
    console.log('📍 URL:', imageUrl);

    return NextResponse.json({
      success: true,
      data: {
        url: imageUrl,
      },
      message: '이미지가 업로드되었습니다.',
    });
  } catch (error) {
    console.error('❌ 이미지 업로드 API 에러:', error);
    console.error('에러 상세:', error instanceof Error ? error.message : error);
    console.error('에러 스택:', error instanceof Error ? error.stack : '');
    
    return NextResponse.json(
      {
        success: false,
        message: '이미지 업로드에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


