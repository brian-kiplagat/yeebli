interface PresignedUrlResponse {
  presignedUrl: string;
  url: string;
}

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  progress?: number;
}

export class FileUploader {
  private static readonly rootUrl = 'http://localhost:3500';
  private static readonly API_ENDPOINT = `${this.rootUrl}/v1/s3/presigned-url`;
  private static authToken: string;

  /**
   * Sets the authentication token for file uploads
   * @param token - The authentication token
   */
  static setAuthToken(token: string) {
    this.authToken = token;
  }

  /**
   * Handles file upload to S3 using presigned URL with progress tracking
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

      // Upload file using XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            localStorage.setItem('progress', progress.toString());
            // Dispatch progress event
            const progressEvent = new CustomEvent('fileUploadProgress', {
              detail: { progress },
            });
            document.dispatchEvent(progressEvent);
          }
        });

        // Handle upload completion
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log('File uploaded successfully');
            resolve({
              success: true,
              url: presignedUrlResponse.url,
              progress: 100,
            });
          } else {
            reject(new Error('Failed to upload file to S3'));
          }
        });

        // Handle upload errors
        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred during upload'));
        });

        // Open and send the request
        xhr.open('PUT', presignedUrlResponse.presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });
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
