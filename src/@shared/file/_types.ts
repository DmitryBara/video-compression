import { FileCategoryEnum, OneFileKeyEnum } from "./_config";
import { StorageDirectoryData } from "./_project";

export type AccessControl = "publicRead" | "private";

export type UploadedFilePaths = {
  [key in OneFileKeyEnum]?: string;
};

export type UploadedFile = {
  id: string;
  fileCategory: FileCategoryEnum;
  accessControl: AccessControl;
  bucketName: string;
  user: string;
} & UploadedFilePaths;

/* setted on firebase backend based on data
received from <GeneratePostPoliciesRequestType> */
export type CustomObjectMetadata = {
  "one-file-key": OneFileKeyEnum;
  "uploaded-file-id": string;
  "file-category": FileCategoryEnum;
  "access-controll": AccessControl;
  "request-user-id": string;
  "bucket-name": string;
  "backend-tunnel-endpoint": string;
  "is-thumbnailing-required": "true" | "false";
};

export type UploadingDoc = {
  /* FUTURE: could be separated into one field "data" (if we want to use same firebase document
  for multiple files uploaded in one time), it will help us to reduce resources usage
  "data": {[key: <uploadedFileId>]: {paths, progress, uploadedFile}} */
  paths: UploadedFilePaths;
  progress: {
    atPub: true;
    atSub?: true;
    processing?: number;
    createdAt: any;
    updatedAt?: any;
  };
  uploadedFile: UploadedFile;
  /* common for one upload */
  createdAt: any;
  userId: string;
};

export type ProcessVideoPayload = {
  originalVideoPath: string;
  commonMetadata: Omit<CustomObjectMetadata, "one-file-key">;
};

export type OneFileInfoType = {
  mimeType: string;
  size: number;
};

export type GeneratePostPoliciesRequestType = {
  uploadedFileId: string;
  storageDirectoryData: StorageDirectoryData;
  fileCategory: FileCategoryEnum;
  allFilesInfo: {
    [key in OneFileKeyEnum]?: OneFileInfoType;
  };
  authenticationToken: string;
  backendTunnelEndpoint: string;
};

export type GeneratedPoliciesType = {
  [key in OneFileKeyEnum]?: {
    url: string;
    fields: { [key: string]: string };
  };
};
