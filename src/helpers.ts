import * as functions from "firebase-functions";
import {
  COMPRESSED_VIDEO_MIME_TYPE,
  COMPRESSED_IMAGE_MIME_TYPE,
  OneFileKeyEnum,
} from "./@shared/file";
import { convertToOtherCase } from "./@shared/helpers/case";

export const getExtensionFromMimeType = (
  mimeType:
    | typeof COMPRESSED_VIDEO_MIME_TYPE
    | typeof COMPRESSED_IMAGE_MIME_TYPE
) => {
  return mimeType.split("/")[1] as "webp" | "mp4";
};

export const getCompressedFileBaseName = (
  oneFileKey: OneFileKeyEnum,
  mimeType:
    | typeof COMPRESSED_VIDEO_MIME_TYPE
    | typeof COMPRESSED_IMAGE_MIME_TYPE
) => {
  const extension = getExtensionFromMimeType(mimeType);
  const one_file_key = convertToOtherCase(oneFileKey, "snake");
  return `_${one_file_key}.${extension}`;
};

export const executionTimeLogger = ({
  functionName,
  startedAt,
  timeLimit,
  metadata,
}: {
  functionName: string;
  startedAt: number;
  timeLimit?: number;
  metadata?: { [key: string]: any };
}) => {
  const finishedAt = new Date().getTime();
  const executionTime = (finishedAt - startedAt) / 1000;

  const logType: "log" | "warn" =
    timeLimit && timeLimit < executionTime ? "warn" : "log";

  const message = `[${functionName}] execution taked ${executionTime} seconds.`;

  functions.logger[logType](message, metadata);
};
