const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { awsKey, awsBucket } = require("./key");

aws.config.update(awsKey);
const s3 = new aws.S3();

const storageS3 = multerS3({
  s3,
  bucket: awsBucket,
  acl: "public-read",
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    cb(null, `image/${Date.now().toString()}-${file.originalname}`);
  },
});

const uploadAnyFile = multer({
  storage: storageS3,
  limits: { fileSize: 1024 * 1024 * 10 },
  fileFilter: (req, file, cb) => cb(null, true),
});

const multipartStartUpload = (
  { folder = "file", fileName, fileType },
  cb = () => 0
) => {
  if (fileName && fileType) {
    try {
      const params = {
        Bucket: awsBucket,
        Key: `${folder}/${fileName}`,
        ContentType: fileType,
      };
      s3.createMultipartUpload(params, (error, result) => {
        if (result && result.UploadId) {
          cb(false, result.UploadId);
        } else {
          cb("Multipart upload failed to start", false);
        }
      });
    } catch (e) {
      cb("Multipart upload failed to start", false);
    }
  } else {
    cb("Filename and filetype are required", false);
  }
};

const multipartUploadUrl = (
  { folder = "file", fileName, partNumber, uploadId },
  cb = () => 0
) => {
  if (fileName && partNumber && uploadId) {
    try {
      const params = {
        Bucket: awsBucket,
        Key: `${folder}/${fileName}`,
        PartNumber: partNumber,
        UploadId: uploadId,
      };
      s3.getSignedUrl("uploadPart", params, (error, uploadUrl) => {
        if (uploadUrl) {
          cb(false, uploadUrl);
        } else {
          cb("Failed to get multipart upload url", false);
        }
      });
    } catch (e) {
      cb("Failed to get multipart upload url", false);
    }
  } else {
    cb("Filename, part number and upload id are required", false);
  }
};

const multipartCompleteUpload = (
  { folder = "file", fileName, parts, uploadId },
  cb = () => 0
) => {
  if (
    fileName &&
    uploadId &&
    parts &&
    parts.every(item => item.ETag && item.PartNumber)
  ) {
    try {
      const params = {
        Bucket: awsBucket,
        Key: `${folder}/${fileName}`,
        MultipartUpload: { Parts: parts },
        UploadId: uploadId,
      };
      s3.completeMultipartUpload(params, (error, result) => {
        if (result && result.Location) {
          cb(false, result.Location);
        } else {
          cb("Failed to get multipart upload response", false);
        }
      });
    } catch (e) {
      cb("Failed to get multipart upload response", false);
    }
  } else {
    cb("Filename, parts and upload id are required", false);
  }
};

const multipartAbortUpload = (
  { folder = "file", fileName, uploadId },
  cb = () => 0
) => {
  if (fileName && uploadId) {
    try {
      const params = {
        Bucket: awsBucket,
        Key: `${folder}/${fileName}`,
        UploadId: uploadId,
      };
      s3.abortMultipartUpload(params, (error, result) => {
        if (error) {
          cb("Failed to abort multipart upload", false);
        } else {
          cb(false, true);
        }
      });
    } catch (e) {
      cb("Failed to abort multipart upload", false);
    }
  } else {
    cb("Filename and upload id are required", false);
  }
};

module.exports = {
  uploadAnyFile,
  multipartStartUpload,
  multipartUploadUrl,
  multipartCompleteUpload,
  multipartAbortUpload,
};
