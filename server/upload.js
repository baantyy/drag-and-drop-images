const express = require("express");
const router = express.Router();
const {
  uploadAnyFile,
  multipartStartUpload,
  multipartUploadUrl,
  multipartCompleteUpload,
  multipartAbortUpload,
} = require("./aws");
const { uploadkey, maxFileCount } = require("./key");

const authHeader = (req, res, next) => {
  if (req.headers["x-pass"] && req.headers["x-pass"] === uploadkey) {
    next();
  } else {
    res.send({ status: false, message: "Invalid key" });
  }
};

// localhost:3005/api/upload
const photos = uploadAnyFile.fields([
  { name: "photos", maxCount: maxFileCount },
]);
router.post("/", authHeader, photos, (req, res) => {
  const files =
    req.files && req.files.photos
      ? req.files.photos.map(item => item.location)
      : [];
  res.status(200).send({ status: true, files });
});

// localhost:3005/api/upload/id
router.post("/id", authHeader, (req, res) => {
  const { fileName, fileType } = req.body;
  multipartStartUpload({ fileName, fileType }, (error, uploadId) => {
    if (uploadId) {
      res.status(200).send({ status: true, uploadId });
    } else {
      res.status(400).send({ status: false, message: error });
    }
  });
});

// localhost:3005/api/upload/url
router.post("/url", authHeader, (req, res) => {
  const { fileName, partNumber, uploadId } = req.body;
  multipartUploadUrl({ fileName, partNumber, uploadId }, (error, uploadUrl) => {
    if (uploadUrl) {
      res.status(200).send({ status: true, uploadUrl });
    } else {
      res.status(400).send({ status: false, message: error });
    }
  });
});

// localhost:3005/api/upload/location
router.post("/location", authHeader, (req, res) => {
  const { fileName, parts, uploadId } = req.body;
  multipartCompleteUpload({ fileName, parts, uploadId }, (error, location) => {
    if (location) {
      res.status(200).send({ status: true, location });
    } else {
      res.status(400).send({ status: false, message: error });
    }
  });
});

// localhost:3005/api/upload/abort
router.post("/abort", authHeader, (req, res) => {
  const { fileName, uploadId } = req.body;
  multipartAbortUpload({ fileName, uploadId }, (error, result) => {
    if (result) {
      res.status(200).send({ status: true });
    } else {
      res.status(400).send({ status: false, message: error });
    }
  });
});

module.exports = router;
