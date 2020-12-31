require("dotenv").config();

const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  AWS_BUCKET,
  UPLOAD_KEY,
  MAX_FILE_COUNT,
} = process.env;

const awsKey = {
  secretAccessKey: AWS_SECRET_ACCESS_KEY || "",
  accessKeyId: AWS_ACCESS_KEY_ID || "",
  region: AWS_REGION || "",
};
const awsBucket = AWS_BUCKET || "";
const uploadkey = UPLOAD_KEY || "";
const maxFileCount = MAX_FILE_COUNT || 1;

module.exports = { awsKey, awsBucket, uploadkey, maxFileCount };
