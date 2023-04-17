export enum FileCategoryEnum {
  IMAGE = "image",
  VIDEO = "video",
  DOCUMENT = "document",
}

export enum OneFileKeyEnum {
  VIDEO_ORIGINAL = "videoOriginal",
  DOCUMENT_ORIGINAL = "documentOriginal",
  CI_HIGH = "compressedImageHigh",
  CI_MEDIUM = "compressedImageMedium",
  CI_LOW = "compressedImageLow",
  CV_HIGH = "compressedVideoHigh",
  CV_MEDIUM = "compressedVideoMedium",
}

export const COMPRESSED_IMAGES_FILE_KEYS = [
  OneFileKeyEnum.CI_HIGH,
  OneFileKeyEnum.CI_MEDIUM,
  OneFileKeyEnum.CI_LOW,
] as const;

export const COMPRESSED_VIDEOS_FILE_KEYS = [
  OneFileKeyEnum.CV_HIGH,
  OneFileKeyEnum.CV_MEDIUM,
] as const;

export const COMPRESSED_IMAGE_MIME_TYPE = "image/webp";
export const COMPRESSED_VIDEO_MIME_TYPE = "video/mp4";

export const VALIDATION_CONFIG: {
  [key in FileCategoryEnum]: {
    mimeTypes: { [key: string]: string };
    maxSize: number;
  };
} = {
  image: {
    mimeTypes: {
      "image/jpeg": "jpeg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/heic": "heic",
      "image/heif": "heif",
    },
    maxSize: 10 * 1024 * 1024,
  },
  video: {
    mimeTypes: {
      "video/mp4": "mp4",
      "video/quicktime": "mov",
      "video/3gpp": "3gp",
      "video/x-msvideo": "avi",
      "video/x-m4v": "m4v",
    },
    maxSize: 100 * 1024 * 1024,
  },
  document: {
    mimeTypes: {
      "application/pdf": "pdf",
    },
    maxSize: 5 * 1024 * 1024,
  },
} as const;

export const UPLOADED_FILE_IS_READY_CONFIG = {
  [FileCategoryEnum.IMAGE]: [...COMPRESSED_IMAGES_FILE_KEYS],
  [FileCategoryEnum.VIDEO]: [
    ...COMPRESSED_IMAGES_FILE_KEYS,
    ...COMPRESSED_VIDEOS_FILE_KEYS,
  ],
  [FileCategoryEnum.DOCUMENT]: [OneFileKeyEnum.DOCUMENT_ORIGINAL],
};
