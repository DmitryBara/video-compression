import * as admin from "firebase-admin";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { Bucket } from "@google-cloud/storage";
import {
  AccessControl,
  CustomObjectMetadata,
  OneFileKeyEnum,
  ProcessVideoPayload,
  UploadingDoc,
} from "./@shared/file";
import { dbClient, storageClient } from ".";

/*
 * Manage all files storing in borders of one UploadedFile
 * all intermediate files are storing in RAM under os.tmdir()
 */
export class UploadedFileManager {
  defaultBucket: Bucket;
  accessControl: AccessControl;
  commonMetadata: ProcessVideoPayload["commonMetadata"];

  localDirectory: string;
  remoteDirectory: string;
  originalVideoFileBaseName: string;
  originalThumbnailFileBaseName: string;

  constructor({ commonMetadata, originalVideoPath }: ProcessVideoPayload) {
    this.commonMetadata = commonMetadata;
    this.defaultBucket = storageClient.bucket(commonMetadata["bucket-name"]);
    this.accessControl = commonMetadata["access-controll"];

    this.localDirectory = path.join(
      os.tmpdir(),
      commonMetadata["uploaded-file-id"]
    );
    this.remoteDirectory = path.dirname(originalVideoPath);
    this.originalVideoFileBaseName = path.basename(originalVideoPath);
    this.originalThumbnailFileBaseName = `${this.originalVideoFileBaseName}_thumbnail.jpeg`;
  }

  getLocalPath(fileBaseName: string) {
    if (!fs.existsSync(this.localDirectory)) {
      fs.mkdirSync(this.localDirectory);
    }

    return path.join(this.localDirectory, fileBaseName);
  }

  getRemotePath(fileBaseName: string) {
    return path.join(this.remoteDirectory, fileBaseName);
  }

  async downloadFromStorage(fileBaseName: string) {
    const localPath = this.getLocalPath(fileBaseName);
    const remotePath = this.getRemotePath(fileBaseName);
    await this.defaultBucket
      .file(remotePath)
      .download({ destination: localPath });
  }

  async deleteFileFromMemory(fileBaseName: string): Promise<void> {
    return new Promise((resolve) => {
      const localPath = this.getLocalPath(fileBaseName);
      fs.unlink(localPath, () => resolve());
    });
  }

  async deleteDirectoryFromMemory(): Promise<void> {
    return new Promise((resolve) => {
      fs.rm(this.localDirectory, { recursive: true, force: true }, () =>
        resolve()
      );
    });
  }

  uploadToStorageWrapper(fileBaseName: string, metadata: CustomObjectMetadata) {
    return () => this.uploadToStorage(fileBaseName, metadata);
  }

  async uploadToStorage(fileBaseName: string, metadata: CustomObjectMetadata) {
    const localPath = this.getLocalPath(fileBaseName);
    const remotePath = this.getRemotePath(fileBaseName);
    await this.defaultBucket.upload(localPath, {
      destination: remotePath,
      metadata: {
        metadata,
      },
      gzip: false,
      predefinedAcl: this.accessControl,
    });

    await this.deleteFileFromMemory(fileBaseName);
  }

  async deleteFromStorage(fileBaseName: string) {
    const remotePath = this.getRemotePath(fileBaseName);
    await this.defaultBucket.file(remotePath).delete();
  }

  /* NOT USED NOW: for upload files (compressed videos) from ffmpeg output to Storage */
  /* FOR FFMPEG: "-movflags +frag_keyframe+empty_moov" */
  getWriteStream(fileBaseName: string, metadata: CustomObjectMetadata) {
    const remotePath = this.getRemotePath(fileBaseName);
    return this.defaultBucket.file(remotePath).createWriteStream({
      metadata: {
        metadata,
      },
      predefinedAcl: this.accessControl,
    });
  }
}

/*
 * Manage total progress of VIDEO processing for whole UploadedFile
 */
const PROCESSING_STEPS_IMPACT = {
  thumbnailing: 0.08,
  [`compression_${OneFileKeyEnum.CV_HIGH}` as const]: 0.38,
  [`compression_${OneFileKeyEnum.CV_MEDIUM}` as const]: 0.38,
  [`uploading_${OneFileKeyEnum.CV_HIGH}` as const]: 0.08,
  [`uploading_${OneFileKeyEnum.CV_MEDIUM}` as const]: 0.08,
};

export class ProcessingProgressManager {
  uploadedFileId: string;
  uploadingDoc: admin.firestore.DocumentReference<Partial<UploadingDoc>>;
  processingProgressDetails: {
    [key in keyof typeof PROCESSING_STEPS_IMPACT]?: number;
  };
  isCleanRequired: boolean;
  cleaner: () => void;

  constructor(uploadedFileId: string) {
    this.uploadedFileId = uploadedFileId;
    this.uploadingDoc = dbClient.collection("Uploading").doc(uploadedFileId);
    this.processingProgressDetails = {};
    this.cleaner = () => {};
    this.isCleanRequired = false;
  }

  setProcessingProgressDetails(
    stepName: keyof typeof PROCESSING_STEPS_IMPACT,
    value: number
  ) {
    this.processingProgressDetails[stepName] =
      value * PROCESSING_STEPS_IMPACT[stepName];
  }

  async startProcessingDataUpdate() {
    return new Promise<void>((resolve, reject) => {
      const intervalId = setInterval(async () => {
        const processingProgressPercentage = Math.ceil(
          Object.values(this.processingProgressDetails).reduce(
            (previousValue, currentElement: number | undefined) =>
              previousValue + (currentElement || 0),
            0
          )
        );

        this.uploadingDoc.update({
          "progress.processing": processingProgressPercentage,
          "progress.updatedAt": admin.firestore.FieldValue.serverTimestamp(),
        });

        this.isCleanRequired = true;

        this.cleaner = async () => {
          if (this.isCleanRequired) {
            clearInterval(intervalId);
            resolve();
            this.isCleanRequired = false;
          }
        };
      }, 3000);
    });
  }

  async stopProcessingDataUpdate() {
    this.cleaner();
  }
}
