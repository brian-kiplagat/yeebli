import { showNotification } from './reusables';

interface PresignedUrlResponse {
  presignedUrl: string;
  url: string;
}

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  progress?: number;
  duration?: number;
}

export class FileUploader {
  private static readonly rootUrl = 'https://api.3themind.com';
  private static readonly API_ENDPOINT = `${this.rootUrl}/v1/asset`;
  private static authToken: string;
  private static upload_progress_wrapper: HTMLElement;
  private static upload_progress_bar: HTMLElement;
  private static upload_progress_counter: HTMLElement;
  //private static upload_prgress_bar_color: string = '#006cd9';

  /**
   * Sets the authentication token for file uploads
   * @param token - The authentication token
   */
  static setAuthToken(token: string) {
    this.authToken = token;
  }

  /**
   * Initializes the progress bar elements
   */
  public static initializeProgressBar() {
    this.upload_progress_wrapper = document.querySelector(
      '[wized="upload_progress_wrapper"]'
    ) as HTMLElement;
    this.upload_progress_bar = document.querySelector(
      '[wized="upload_progress_bar"]'
    ) as HTMLElement;
    this.upload_progress_counter = document.querySelector(
      '[wized="upload_progress_counter"]'
    ) as HTMLElement;

    if (!this.upload_progress_wrapper) {
      console.error('Progress bar wrapper not found');
    }
    if (!this.upload_progress_bar) {
      console.error('Progress bar not found');
    }
    if (!this.upload_progress_counter) {
      console.error('Progress counter not found');
    }
  }
  /**
   * Resets the progress bar
   */
  public static resetProgressBar() {
    this.upload_progress_bar.style.width = '0%';
    //this.upload_progress_bar.style.backgroundColor = '#fe5b25';
    this.upload_progress_counter.textContent = '0%';
  }

  /**
   * Updates the progress bar width based on upload progress
   * @param progress - Upload progress percentage (0-100)
   */
  private static updateProgressBar(progress: number) {
    if (this.upload_progress_bar) {
      this.upload_progress_bar.style.width = `${progress}%`;
      if (progress === 100) {
        this.upload_progress_bar.style.backgroundColor = 'green';
        //wait 1 second and hide the wrapper
        setTimeout(() => {
          this.resetProgressBar();
          this.hideProgressBar();
        }, 1000);
        //reset the progress counter
      } else {
        //this.upload_progress_bar.style.backgroundColor = this.upload_progress_bar_color;
      }
    }
    if (this.upload_progress_counter) {
      this.upload_progress_counter.textContent = `${progress}%`;
    }
  }

  /**
   * Shows the progress bar
   */
  public static showProgressBar() {
    this.upload_progress_wrapper.style.display = 'flex';
  }
  /**
   * Hides the progress bar
   */
  public static hideProgressBar() {
    this.upload_progress_wrapper.style.display = 'none';
  }

  /**
   * Gets the duration of a video file
   * @param file - The video file to get duration for
   * @returns Promise<number> - The duration in seconds
   */
  private static getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video metadata'));
      };

      video.src = URL.createObjectURL(file);
    });
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
      let duration: number = 0;

      // Get duration if it's a video file
      if (file.type.startsWith('video/')) {
        try {
          duration = await this.getVideoDuration(file);
          duration = Math.ceil(duration);
          // Dispatch video metadata event
          const metadataEvent = new CustomEvent('videoMetadataLoaded', {
            detail: { duration: duration },
          });
          document.dispatchEvent(metadataEvent);
        } catch (error) {
          showNotification('An error occurred while getting the video duration');
          console.error('Failed to get video duration:', error);
        }
      }

      const assetType = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
          ? 'video'
          : file.type.startsWith('audio/')
            ? 'audio'
            : 'document';

      // Get presigned URL
      const presignedUrlResponse = await this.getPresignedUrl(
        file.name,
        file.type,
        assetType,
        file.size,
        duration
      );

      // Upload file using XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            localStorage.setItem('progress', progress.toString());
            // Update progress bar
            this.updateProgressBar(progress);
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
            //@ts-expect-error - Wized is injected by Webflow at runtime
            Wized.requests.execute('Get_Assets');
            resolve({
              success: true,
              url: presignedUrlResponse.url,
              progress: 100,
              duration,
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
      showNotification('An error occurred while uploading this file');
      console.error(error);
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
    contentType: string,
    assetType: string,
    fileSize: number,
    duration: number
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
        assetType,
        fileSize,
        duration: Math.ceil(duration),
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
  // Initialize progress bar elements
  FileUploader.initializeProgressBar();
  //hide the progreebar initially
  FileUploader.hideProgressBar();
  const fileInput = document.querySelector('[wized="file_uploader"]') as HTMLInputElement;

  if (!fileInput) {
    showNotification('File upload input not found');
    return;
  }

  fileInput.addEventListener('change', async () => {
    //show the progress bar
    FileUploader.showProgressBar();
    FileUploader.resetProgressBar();
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
