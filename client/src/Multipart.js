import React, { useState } from "react";
import axios from "axios";
import { apiUrl } from "./key";
import "./multipart.css";

const uploadIcon = require("./upload.svg");
const apiEndPoint = `${apiUrl}/api/upload`;

const MultipartUpload = ({ pass }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileUploadId, setFileUploadId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [aborting, setAborting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [percentage, setPercentage] = useState({});

  const startUpload = async () => {
    reset({ upload: true });
    try {
      // get upload id of the file from aws
      const res = await axios.post(
        `${apiEndPoint}/id`,
        { fileName, fileType: file?.type },
        { headers: { "x-pass": pass } }
      );
      const { status, uploadId, message } = res.data;
      if (status && uploadId) {
        setFileUploadId(uploadId);
        uploadMultipartFile(fileName, uploadId);
      } else {
        reset({ error: message });
      }
    } catch (e) {
      reset({
        error:
          e?.response?.data?.message || "Unable to start upload. Try again!",
      });
    }
  };

  const uploadMultipartFile = async (fileName, uploadId) => {
    try {
      const CHUNK_SIZE = 25 * 1000000; // 25MB
      const CHUNKS_COUNT = Math.floor(file?.size / CHUNK_SIZE) + 1;

      // divide files into multiple blobs
      const blobArray = Array(CHUNKS_COUNT)
        .fill(null)
        .map((_, index) => {
          const start = index * CHUNK_SIZE;
          const end = (index + 1) * CHUNK_SIZE;
          return index + 1 < CHUNKS_COUNT
            ? file.slice(start, end)
            : file.slice(start);
        });
      // if all blobs are valid
      if (blobArray.every(Boolean)) {
        // get upload urls for all blobs from aws
        const uploadUrls = await Promise.all(
          blobArray.map(
            async (_, index) =>
              await axios.post(
                `${apiEndPoint}/url`,
                { fileName, partNumber: index + 1, uploadId },
                { headers: { "x-pass": pass } }
              )
          )
        );
        const uploadUrlsArray = uploadUrls.map(
          (item, index) => item?.data?.uploadUrl
        );
        // if all urls are valid
        if (uploadUrlsArray.every(Boolean)) {
          // upload multiple chunks into aws parallelly
          const uploadParts = await Promise.all(
            uploadUrlsArray.map(
              async (item, index) =>
                await axios.put(item, blobArray?.[index], {
                  headers: { "Content-Type": file?.type },
                  onUploadProgress: e => {
                    setPercentage(prev => ({
                      ...prev,
                      [index]: Math.round((e?.loaded * 100) / e?.total),
                    }));
                  },
                })
            )
          );
          const uploadPartsArray = uploadParts.map((item, index) => ({
            ETag: item?.headers?.etag,
            PartNumber: index + 1,
          }));
          // upload ETag and file number to aws to add all the chunks into single file
          if (uploadPartsArray.every(item => item?.ETag && item?.PartNumber)) {
            const result = await axios.post(
              `${apiEndPoint}/location`,
              { fileName, parts: uploadPartsArray, uploadId },
              { headers: { "x-pass": pass } }
            );
            // get the complete file url
            reset({
              success: "Successfully uploaded",
              file: result?.data?.location,
            });
          } else {
            reset({ error: "Missing fields found. Try again!" });
          }
        } else {
          reset({ error: "Missing urls found. Try again!" });
        }
      } else {
        reset({ error: "Missing chunk file found. Try again!" });
      }
    } catch (e) {
      reset({
        error: e?.response?.data?.message || "Missing urls found. Try again!",
      });
    }
  };

  const percentageCount = Object.keys(percentage).length
    ? Math.round(
        Object.keys(percentage).reduce((acc, cur) => {
          acc += percentage[cur] || 0;
          return acc;
        }, 0) / Object.keys(percentage).length
      )
    : 0;

  // provide filename and upload id to aws to abort the upload
  const abortUpload = async () => {
    reset({ abort: true });
    try {
      await axios.post(
        `${apiEndPoint}/abort`,
        { fileName, uploadId: fileUploadId },
        { headers: { "x-pass": pass } }
      );
      reset({ success: "Successfully aborted" });
    } catch (e) {
      reset({ error: e?.response?.data?.message || "Unable to abort" });
    }
  };

  const reset = ({
    upload = false,
    abort = false,
    success = "",
    error = "",
    file = "",
  }) => {
    setFileUploadId("");
    setFileUrl(file);
    setSuccessMsg(success);
    setErrorMsg(error);
    setUploading(upload);
    setAborting(abort);
    setPercentage({});
    if (success) {
      setFileName("");
      setFile(null);
    }
  };

  return (
    <div className="multipart">
      <h2>AWS Multipart Upload</h2>
      <div className="input">
        <div>
          <input
            type="file"
            onChange={e => {
              const inputFile = e?.target?.files?.[0];
              setFile(inputFile);
              setFileName(`${Date.now()}-${inputFile?.name}`);
            }}
          />
          <span>
            <img src={uploadIcon} alt="upload" />
            <i>{file?.name || "Upload file"}</i>
          </span>
        </div>
        <span
          className="progress"
          style={{ width: `${percentageCount}%` }}
        ></span>
        <button
          onClick={() => startUpload()}
          disabled={uploading || aborting || !file}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
        <button onClick={() => abortUpload()} disabled={aborting || !uploading}>
          {aborting ? "Aborting..." : "Abort"}
        </button>
      </div>
      <div className="message">
        {successMsg ? (
          <div className="success">{successMsg}</div>
        ) : errorMsg ? (
          <div className="error">{errorMsg}</div>
        ) : null}
      </div>
      {fileUrl ? <div className="message">{fileUrl}</div> : null}
    </div>
  );
};

export default MultipartUpload;
