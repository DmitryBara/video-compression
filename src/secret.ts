import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import * as dotenv from "dotenv";

const VIDEO_ENV_SECRET_NAME = "video-env";

const initializeSecretManager = async () => {
  const client = new SecretManagerServiceClient();
  const [accessResponse] = await client.accessSecretVersion({
    name: `projects/${process.env.GCLOUD_PROJECT}/secrets/${VIDEO_ENV_SECRET_NAME}/versions/latest`,
  });

  const responsePayload = accessResponse.payload.data.toString();
  return dotenv.parse(responsePayload);
};

class SecretAccessor {
  envVars: dotenv.DotenvParseOutput | undefined;
  constructor() {
    this.envVars = undefined;
  }

  getEnvVar = async (name: string) => {
    if (!this.envVars) {
      this.envVars = await initializeSecretManager();
    }

    const variable = this.envVars[name];
    if (!variable) {
      throw new Error(`Variable ${name} not exist.`);
    }
    return variable;
  };
}

export const secretAccessor = new SecretAccessor();
