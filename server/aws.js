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
    cb(null, Date.now().toString() + "_" + file.originalname);
  },
});

const uploadAnyFile = multer({
  storage: storageS3,
  limits: { fileSize: 1024 * 1024 * 10 },
  fileFilter: (req, file, cb) => cb(null, true),
});

module.exports = { uploadAnyFile };
