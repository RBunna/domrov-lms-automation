import { NextRequest, NextResponse } from 'next/server';
import * as fileService from './service';
import { PresignedUrlRequestDto, NotifyUploadDto, ResourceTypeParam } from './dto';

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        switch (action) {
            case 'presigned-url': {
                const filename = url.searchParams.get('filename');
                const contentType = url.searchParams.get('contentType');
                const resourceType = url.searchParams.get('resourceType') as ResourceTypeParam;
                const resourceId = url.searchParams.get('resourceId');

                if (!filename || !contentType || !resourceType || !resourceId) {
                    return NextResponse.json(
                        { success: false, error: 'filename, contentType, resourceType, and resourceId are required' },
                        { status: 400 }
                    );
                }

                const data: PresignedUrlRequestDto = {
                    filename,
                    contentType,
                    resourceType,
                    resourceId: parseInt(resourceId),
                };

                const result = await fileService.getPresignedUrl(data, token);
                return NextResponse.json(result);
            }

            case 'download': {
                const resourceId = url.searchParams.get('resourceId');
                if (!resourceId) {
                    return NextResponse.json(
                        { success: false, error: 'resourceId is required' },
                        { status: 400 }
                    );
                }

                const blob = await fileService.downloadFile(parseInt(resourceId), token);

                // Return the blob as a response
                return new NextResponse(blob, {
                    headers: {
                        'Content-Type': 'application/octet-stream',
                    },
                });
            }

            default:
                return NextResponse.json(
                    { success: false, error: 'Invalid action' },
                    { status: 400 }
                );
        }
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');
        const body = await request.json();
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');

        switch (action) {
            case 'notify-upload': {
                const data: NotifyUploadDto = body;
                const result = await fileService.notifyUpload(data, token);
                return NextResponse.json(result);
            }

            default:
                return NextResponse.json(
                    { success: false, error: 'Invalid action' },
                    { status: 400 }
                );
        }
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
