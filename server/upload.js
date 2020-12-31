const express = require("express");
const router = express.Router();
const { uploadAnyFile } = require("./aws");
const { uploadkey, maxFileCount } = require("./key");

const authHeader = (req, res, next) => {
  if (req.headers["x-pass"] && req.headers["x-pass"] === uploadkey) {
    next();
  } else {
    res.send({ status: false, message: "Say something interesting" });
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
  res.send({ status: true, files });
});

module.exports = router;
