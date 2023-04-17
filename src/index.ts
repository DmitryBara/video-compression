import express from "express";
import * as admin from "firebase-admin";
import { Storage } from "@google-cloud/storage";
import { processVideoHandler } from "./processVideoHandler";
import { ProcessVideoPayload } from "./@shared/file";
import { secretAccessor } from "./secret";

admin.initializeApp();

export const dbClient = admin.firestore();
export const storageClient = new Storage();

const app = express();
app.use(express.json());

/* TO IMPROVE: 
 create microservices with different configuration
 and allocate as much memory as necessary:
 video-128, video-256, video-512 */
app.post("/processVideo", async (req, res) => {
  const authFirebase = await secretAccessor.getEnvVar("AUTH_FIREBASE");
  if (!authFirebase || authFirebase !== req.headers.authorization) {
    res.status(403).send();
    return;
  }

  const body = req.body as ProcessVideoPayload;
  const uploadedFileId = body.commonMetadata["uploaded-file-id"];

  await processVideoHandler(body, uploadedFileId);
  res.status(200).send();

  return;
});

app.listen(4000, () => {
  console.log(`Server started on port 4000.`);
});
