import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import {
  compressImage,
  compressVideo,
  generateThumbnail,
} from "./transformers";
import { ProcessingProgressManager, UploadedFileManager } from "./managers";
import {
  COMPRESSED_IMAGES_FILE_KEYS,
  OneFileKeyEnum,
  ProcessVideoPayload,
} from "./@shared/file";
import { dbClient } from ".";

const videoCompression = async (
  UFManager: UploadedFileManager,
  PPManager: ProcessingProgressManager
) => {
  /* Uploading performed immediately */
  await compressVideo({
    UFManager,
    PPManager,
    oneFileKey: OneFileKeyEnum.CV_HIGH,
  });

  /* Uploading whill be performed when "uploader()" function will be invoked */
  const uploader = await compressVideo<Function>({
    UFManager,
    PPManager,
    oneFileKey: OneFileKeyEnum.CV_MEDIUM,
  });

  return uploader;
};

const videoThumbnailing = async (UFManager: UploadedFileManager) => {
  await generateThumbnail({
    UFManager,
  });

  for (const oneFileKey of COMPRESSED_IMAGES_FILE_KEYS) {
    await compressImage({
      UFManager,
      oneFileKey,
    });
  }

  UFManager.deleteFileFromMemory(UFManager.originalThumbnailFileBaseName);
};

/*
 * HANDLER
 */
export const processVideoHandler = async (
  payload: ProcessVideoPayload,
  uploadedFileId: string
) => {
  const UFManager = new UploadedFileManager(payload);
  const PPManager = new ProcessingProgressManager(uploadedFileId);

  try {
    await UFManager.downloadFromStorage(UFManager.originalVideoFileBaseName);

    await PPManager.uploadingDoc.update({
      "progress.atSub": true,
      "progress.updatedAt": admin.firestore.FieldValue.serverTimestamp(),
    });

    PPManager.startProcessingDataUpdate();

    if (payload.commonMetadata["is-thumbnailing-required"] === "true") {
      await videoThumbnailing(UFManager);
    }

    PPManager.setProcessingProgressDetails("thumbnailing", 100);

    const lastUploader = await videoCompression(UFManager, PPManager);

    await UFManager.deleteFromStorage(UFManager.originalVideoFileBaseName);
    await UFManager.deleteFileFromMemory(UFManager.originalVideoFileBaseName);
    await PPManager.stopProcessingDataUpdate();

    await lastUploader();
    await UFManager.deleteDirectoryFromMemory();

    return true;
  } catch (error) {
    functions.logger.error(`[VIDEO] Uploading failed ${uploadedFileId}`, error);

    await PPManager.stopProcessingDataUpdate();
    await dbClient.collection("Uploading").doc(uploadedFileId).delete();
  }
};
