import * as path from "path";
import ffmpeg from "fluent-ffmpeg";
import * as functions from "firebase-functions";
import {
  COMPRESSED_IMAGES_FILE_KEYS,
  COMPRESSED_IMAGE_MIME_TYPE,
  COMPRESSED_VIDEOS_FILE_KEYS,
  COMPRESSED_VIDEO_MIME_TYPE,
  COMPRESSION_IMAGE_CONFIG,
  COMPRESSION_VIDEO_CONFIG,
  CustomObjectMetadata,
  OneFileKeyEnum,
} from "./@shared/file";
import {
  executionTimeLogger,
  getCompressedFileBaseName,
  getExtensionFromMimeType,
} from "./helpers";
import { ProcessingProgressManager, UploadedFileManager } from "./managers";

export const generateThumbnail = async ({
  UFManager,
}: {
  UFManager: UploadedFileManager;
}) => {
  const startedAt = new Date().getTime();

  const inputPath = UFManager.getLocalPath(UFManager.originalVideoFileBaseName);

  const outputPath = UFManager.getLocalPath(
    UFManager.originalThumbnailFileBaseName
  );

  return new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(inputPath)
      .screenshot({
        count: 1,
        timemarks: ["00:00:01.000"],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
      })
      .outputOptions(["-vframes 1"])
      .on("end", (...ffmpegArgs: any) => {
        executionTimeLogger({
          functionName: "generateThumbnail",
          startedAt,
          timeLimit: 10,
          metadata: {
            inputPath,
            outputPath,
            ffmpegArgs,
          },
        });

        resolve();
      })
      .on("error", (err: any) => {
        reject(err);
      });
  });
};

export const compressImage = async ({
  UFManager,
  oneFileKey,
}: {
  UFManager: UploadedFileManager;
  oneFileKey: typeof COMPRESSED_IMAGES_FILE_KEYS[number];
}) => {
  const startedAt = new Date().getTime();

  const compressedImageBaseName = getCompressedFileBaseName(
    oneFileKey,
    COMPRESSED_IMAGE_MIME_TYPE
  );

  const inputPath = UFManager.getLocalPath(
    UFManager.originalThumbnailFileBaseName
  );
  const outputPath = UFManager.getLocalPath(compressedImageBaseName);

  const metadata: CustomObjectMetadata = {
    "one-file-key": oneFileKey,
    ...UFManager.commonMetadata,
  };

  const [maxWidth, maxHeight, fit] = [
    COMPRESSION_IMAGE_CONFIG[oneFileKey].width,
    COMPRESSION_IMAGE_CONFIG[oneFileKey].height,
    COMPRESSION_IMAGE_CONFIG[oneFileKey].fit,
  ];

  const ffmpegFit = fit === "outside" ? "decrease" : "increase";

  return new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(inputPath)
      .format(getExtensionFromMimeType(COMPRESSED_IMAGE_MIME_TYPE) as "webp")
      .outputOptions([
        // FUTURE: -qscale:v - for output quality control
        `-filter:v scale='min(${maxWidth},iw)':min'(${maxHeight},ih)':force_original_aspect_ratio=${ffmpegFit}`,
      ])
      .on("end", async (...ffmpegArgs: any) => {
        executionTimeLogger({
          functionName: "compressImage",
          startedAt,
          timeLimit: 180,
          metadata: {
            metadata,
            ffmpegArgs,
          },
        });

        await UFManager.uploadToStorage(compressedImageBaseName, metadata);

        resolve();
      })
      .on("error", (err: any) => {
        reject(err);
      })
      .output(outputPath)
      .run();
  });
};

export async function compressVideo<ReturnType>({
  UFManager,
  PPManager,
  oneFileKey,
}: {
  UFManager: UploadedFileManager;
  PPManager: ProcessingProgressManager;
  oneFileKey: typeof COMPRESSED_VIDEOS_FILE_KEYS[number];
}): Promise<ReturnType> {
  const startedAt = new Date().getTime();

  const compressedVideoBaseName = getCompressedFileBaseName(
    oneFileKey,
    COMPRESSED_VIDEO_MIME_TYPE
  );

  const inputPath = UFManager.getLocalPath(UFManager.originalVideoFileBaseName);
  const outputPath = UFManager.getLocalPath(compressedVideoBaseName);

  const metadata: CustomObjectMetadata = {
    "one-file-key": oneFileKey,
    ...UFManager.commonMetadata,
  };

  const [maxWidth, maxHeight] = [
    COMPRESSION_VIDEO_CONFIG[oneFileKey].width,
    COMPRESSION_VIDEO_CONFIG[oneFileKey].height,
  ];

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputPath)
      .videoCodec("libx264")
      .format(getExtensionFromMimeType(COMPRESSED_VIDEO_MIME_TYPE) as "mp4")
      .outputOptions([
        "-crf 23",
        "-movflags +faststart",
        `-filter:v scale=ceil('min(${maxWidth},iw)/2')*2:ceil('min(${maxHeight},ih)/2')*2:force_original_aspect_ratio=decrease:force_divisible_by=2`,
        "-acodec copy",
        // Without last line some iphone audio codecs are distorted, for example:
        // (Audio: aac (LC) (mp4a / 0x6134706D), 44100 Hz, stereo, fltp, 172 kb/s (default))
        // FUTURE: Check default audio compress alghorithm
      ])
      .on("progress", (progress: any) => {
        PPManager.setProcessingProgressDetails(
          `compression_${oneFileKey}`,
          progress.percent
        );
      })
      .on("end", async (...ffmpegArgs: any) => {
        executionTimeLogger({
          functionName: "compressVideo",
          startedAt,
          timeLimit: 180,
          metadata: {
            metadata,
            ffmpegArgs,
          },
        });

        if (oneFileKey !== OneFileKeyEnum.CV_MEDIUM) {
          await UFManager.uploadToStorage(compressedVideoBaseName, metadata);
          resolve(null);
        } else {
          const uploader = UFManager.uploadToStorageWrapper(
            compressedVideoBaseName,
            metadata
          );

          resolve(uploader as ReturnType);
        }
      })
      .on("error", (...ffmpegArgs: any) => {
        functions.logger.error("Error while compression. Click for details.", {
          ffmpegArgs,
        });
        reject("Compression error");
      })
      .output(outputPath)
      .run();
  });
}
