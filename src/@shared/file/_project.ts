import {
  FileCategoryEnum,
  OneFileKeyEnum,
  COMPRESSED_VIDEOS_FILE_KEYS,
  COMPRESSED_IMAGES_FILE_KEYS,
} from "./_config";

export const COMPRESSION_IMAGE_CONFIG: {
  [key in typeof COMPRESSED_IMAGES_FILE_KEYS[number]]: {
    quality: number;
    width: number;
    height: number;
    fit: "outside" | "inside";
  };
} = {
  [OneFileKeyEnum.CI_HIGH]: {
    quality: 0.95,
    width: 1920,
    height: 1080,
    fit: "outside",
  },
  [OneFileKeyEnum.CI_MEDIUM]: {
    quality: 0.95,
    width: 576,
    height: 1024,
    fit: "outside",
  },
  [OneFileKeyEnum.CI_LOW]: {
    quality: 0.9,
    width: 160,
    height: 160,
    fit: "inside",
  },
} as const;

export const COMPRESSION_VIDEO_CONFIG: {
  [key in typeof COMPRESSED_VIDEOS_FILE_KEYS[number]]: {
    width: number;
    height: number;
  };
} = {
  [OneFileKeyEnum.CV_HIGH]: {
    width: COMPRESSION_IMAGE_CONFIG[OneFileKeyEnum.CI_HIGH].width,
    height: COMPRESSION_IMAGE_CONFIG[OneFileKeyEnum.CI_HIGH].height,
  },
  [OneFileKeyEnum.CV_MEDIUM]: {
    width: COMPRESSION_IMAGE_CONFIG[OneFileKeyEnum.CI_MEDIUM].width,
    height: COMPRESSION_IMAGE_CONFIG[OneFileKeyEnum.CI_MEDIUM].height,
  },
};

export enum StorageFolderEnum {
  BUSINESS_AVATAR = "business_avatar",
  BUSINESS_DOCUMENT = "business_document",
  PRODUCT_MEDIA = "product_media",
  USER_AVATAR = "user_avatar",
  ORGANIZER_AVATAR = "organizer_avatar",
  EVENT_MEDIA = "event_media",
  MESSAGE_FILE = "message_file",
}

export const STORAGE_FOLDER_VALIDATORS: {
  [key in StorageFolderEnum]: {
    requiredDirectoryDataFields: string[];
    allowedFileCategories: FileCategoryEnum[];
  };
} = {
  [StorageFolderEnum.BUSINESS_AVATAR]: {
    requiredDirectoryDataFields: ["businessId"],
    allowedFileCategories: [FileCategoryEnum.IMAGE],
  },
  [StorageFolderEnum.BUSINESS_DOCUMENT]: {
    requiredDirectoryDataFields: ["businessId"],
    allowedFileCategories: [FileCategoryEnum.DOCUMENT],
  },
  [StorageFolderEnum.PRODUCT_MEDIA]: {
    requiredDirectoryDataFields: ["businessId", "productId"],
    allowedFileCategories: [FileCategoryEnum.IMAGE, FileCategoryEnum.VIDEO],
  },
  [StorageFolderEnum.USER_AVATAR]: {
    requiredDirectoryDataFields: ["userId"],
    allowedFileCategories: [FileCategoryEnum.IMAGE],
  },
  [StorageFolderEnum.ORGANIZER_AVATAR]: {
    requiredDirectoryDataFields: ["organizerId"],
    allowedFileCategories: [FileCategoryEnum.IMAGE],
  },
  [StorageFolderEnum.EVENT_MEDIA]: {
    requiredDirectoryDataFields: ["organizerId", "eventId"],
    allowedFileCategories: [FileCategoryEnum.IMAGE, FileCategoryEnum.VIDEO],
  },
  [StorageFolderEnum.MESSAGE_FILE]: {
    requiredDirectoryDataFields: ["chatId", "messageId"],
    allowedFileCategories: [
      FileCategoryEnum.IMAGE,
      FileCategoryEnum.VIDEO,
      FileCategoryEnum.DOCUMENT,
    ],
  },
};

export interface StorageDirectoryData {
  storageFolder: StorageFolderEnum;
  businessId?: string;
  productId?: string;
  userId?: string;
  organizerId?: string;
  eventId?: string;
  chatId?: string;
  messageId?: string;
}
