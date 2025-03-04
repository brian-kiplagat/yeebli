interface PresignedUrlResponse {
  presignedUrl: string;
  url: string;
}

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class FileUploader {
  private static readonly API_ENDPOINT = 'http://localhost:3500/v1/s3/presigned-url';
  private static authToken: string;

  /**
   * Sets the authentication token for file uploads
   * @param token - The authentication token
   */
  static setAuthToken(token: string) {
    this.authToken = token;
  }

  /**
   * Handles file upload to S3 using presigned URL
   * @param fileInput - The file input element with wized="file_uploader"
   * @returns Promise<UploadResult>
   */
  static async handleFileUpload(fileInput: HTMLInputElement): Promise<UploadResult> {
    try {
      if (!fileInput.files || fileInput.files.length === 0) {
        throw new Error('No file selected');
      }

      const file = fileInput.files[0];

      // Get presigned URL
      const presignedUrlResponse = await this.getPresignedUrl(file.name, file.type);

      // Upload file to S3 using the presigned URL
      const uploadResponse = await fetch(presignedUrlResponse.presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3');
      }

      return {
        success: true,
        url: presignedUrlResponse.url,
      };
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Gets presigned URL from the API
   * @param fileName - Name of the file to upload
   * @param contentType - MIME type of the file
   * @returns Promise<PresignedUrlResponse>
   */
  private static async getPresignedUrl(
    fileName: string,
    contentType: string
  ): Promise<PresignedUrlResponse> {
    if (!this.authToken) {
      throw new Error('Authentication token not set');
    }

    const response = await fetch(this.API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.authToken}`,
      },
      body: JSON.stringify({
        fileName,
        contentType,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get presigned URL');
    }

    return response.json();
  }
}

// Initialize file upload handler
export function initializeFileUpload(authToken: string) {
  // Set the auth token
  FileUploader.setAuthToken(authToken);

  const fileInput = document.querySelector('[wized="file_uploader"]') as HTMLInputElement;

  if (!fileInput) {
    console.warn('File upload input not found');
    return;
  }

  fileInput.addEventListener('change', async () => {
    const result = await FileUploader.handleFileUpload(fileInput);

    if (result.success) {
      // Dispatch custom event with upload result
      const uploadEvent = new CustomEvent('fileUploadComplete', {
        detail: { url: result.url },
      });
      document.dispatchEvent(uploadEvent);
    } else {
      // Dispatch error event
      const errorEvent = new CustomEvent('fileUploadError', {
        detail: { error: result.error },
      });
      document.dispatchEvent(errorEvent);
    }
  });
}
