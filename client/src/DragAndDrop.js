import React, { Component } from "react";
import styled from "styled-components";
import axios from "axios";
import * as api from "./api";

const uuid4 = require("uuid4");
const laodingIcon = require("./loading.gif");
const deleteIcon = require("./close.svg");
const uploadIcon = require("./upload.svg");

class DragAndDrop extends Component {
  constructor(props) {
    super(props);
    this.dragCounter = 0;
    this.state = {
      dragging: false,
      files: [],
      fileTypes: ["image/png", "image/jpeg", "image/gif", "image/svg+xml"],
      ignoredFiles: [],
      uploading: false,
      result: [],
      error: "",
      success: "",
      key: "",
    };
  }

  componentDidMount() {
    const div = this.dropRef;
    div.addEventListener("dragenter", this.handleDragIn);
    div.addEventListener("dragleave", this.handleDragOut);
    div.addEventListener("dragover", this.handleDrag);
    div.addEventListener("drop", this.handleDrop);
  }

  componentWillUnmount() {
    const div = this.dropRef;
    div.removeEventListener("dragenter", this.handleDragIn);
    div.removeEventListener("dragleave", this.handleDragOut);
    div.removeEventListener("dragover", this.handleDrag);
    div.removeEventListener("drop", this.handleDrop);
  }

  handleDrag = e => {
    e.preventDefault();
    e.stopPropagation();
  };

  handleDragIn = e => {
    e.preventDefault();
    e.stopPropagation();
    this.dragCounter++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      this.setState({ dragging: true });
    }
  };

  handleDragOut = e => {
    e.preventDefault();
    e.stopPropagation();
    this.dragCounter--;
    if (this.dragCounter === 0) {
      this.setState({ dragging: false });
    }
  };

  handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ dragging: false });
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      this.updateFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
      this.dragCounter = 0;
    }
  };

  handleChange = e => {
    const { files } = e.target;
    if (files.length > 0) {
      this.updateFiles(files);
    }
  };

  updateFiles = files => {
    const { fileTypes } = this.state;
    const newFiles = [];
    const ignoredFiles = [];
    for (let i = 0; i < files.length; i++) {
      if (fileTypes.includes(files[i].type)) {
        newFiles.push({
          id: uuid4(),
          file: files[i],
          preview: "",
        });
      } else {
        ignoredFiles.push(files[i].name);
      }
    }
    this.setState(prevState => ({
      files: [...prevState.files, ...newFiles],
      ignoredFiles,
    }));
  };

  previewImages = files => {
    const { fileTypes } = this.state;
    files.forEach(file => {
      if (!file.preview && fileTypes.includes(file.file.type)) {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          this.setState(prevState => ({
            files: prevState.files.map(item => {
              if (item.id === file.id) {
                item.preview = reader.result;
              }
              return item;
            }),
          }));
        });
        reader.readAsDataURL(file.file);
      }
    });
  };

  shouldComponentUpdate(nextProps, nextState) {
    if (nextState.files.length > this.state.files.length) {
      this.previewImages(nextState.files);
    }
    return true;
  }

  removeFile = id => {
    this.setState(prevState => ({
      files: prevState.files.filter(item => item.id !== id),
    }));
  };

  handleUpload = () => {
    if (this.state.files.length && this.state.key) {
      this.setState({
        uploading: true,
        result: [],
        ignoredFiles: [],
        error: "",
        success: "",
      });
      const formData = new FormData();
      for (const item of this.state.files) {
        formData.append("photos", item.file);
      }
      axios
        .post(api.upload, formData, { headers: { "x-pass": this.state.key } })
        .then(res => {
          this.setState({ uploading: false });
          const { files, status, message } = res.data;
          if (status && files && files.length) {
            this.setState({
              result: files,
              files: [],
              success: "Successfully uploaded",
            });
          } else {
            this.setState({ error: message || "Nothing got uploaded" });
          }
        })
        .catch(() => {
          this.setState({ uploading: false, error: "Something went wrong" });
        });
    }
  };

  render() {
    const {
      files,
      dragging,
      ignoredFiles,
      uploading,
      success,
      error,
      result,
      key,
    } = this.state;
    return (
      <Container>
        <Title>Drag and Drop Images</Title>
        <Wrapper ref={e => (this.dropRef = e)} dragging={dragging}>
          {dragging && <DragBox>Drop here</DragBox>}
          <Items>
            {files.map(item => (
              <Item key={item.id}>
                <Img src={item.preview || laodingIcon} />
                {item.preview && (
                  <DeleteBtn onClick={() => this.removeFile(item.id)}>
                    <DeleteIcon src={deleteIcon} />
                  </DeleteBtn>
                )}
              </Item>
            ))}
          </Items>
          {files.length === 0 && !dragging && (
            <Upload>
              <UploadIcon src={uploadIcon} />
              <UploadText>Drag and drop images here</UploadText>
            </Upload>
          )}
        </Wrapper>
        <InputWrapper>
          <InputFile type="file" onChange={this.handleChange} multiple />
          <InputText>Click here to add images</InputText>
        </InputWrapper>
        <SubmitWrapper>
          <Input
            placeholder="Say something..."
            value={key}
            onChange={e => this.setState({ key: e.target.value })}
            type="password"
          />
          <Button disabled={uploading} onClick={() => this.handleUpload()}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </SubmitWrapper>
        {ignoredFiles.length > 0 && (
          <ErrorFiles>
            Following files are not allowed -
            <ErrorFileItems>
              {ignoredFiles.map((item, index) => (
                <ErrorFileItem key={index}>{item}</ErrorFileItem>
              ))}
            </ErrorFileItems>
          </ErrorFiles>
        )}
        {success || error ? (
          <Message>
            {success ? (
              <Success>{success}</Success>
            ) : error ? (
              <Error>{error}</Error>
            ) : null}
          </Message>
        ) : null}
        {result.length ? (
          <Result>
            {result.map((item, index) => (
              <ResultItem key={index}>
                <ResultImg src={item} />
                <ResultText>{item}</ResultText>
              </ResultItem>
            ))}
          </Result>
        ) : null}
      </Container>
    );
  }
}

const SubmitWrapper = styled.div`
  margin: 10px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Input = styled.input`
  border: 1px solid #ddd;
  font-size: 13px;
  outline: 0;
  border-radius: 3px;
  padding: 10px 15px;
  width: calc(100% - 120px);
`;

const Result = styled.div`
  margin: 30px 0 0;
`;

const ResultItem = styled.div`
  display: flex;
  flex-direction: row;
  margin: 0 0 10px 0;
`;

const ResultImg = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  margin: 0 10px 0 0;
`;

const ResultText = styled.div`
  width: calc(100% - 90px);
  font-size: 15px;
  word-break: break-all;
`;

const Message = styled.div`
  margin: 30px 0 0;
  text-align: center;
  font-size: 15px;
`;

const Success = styled.div`
  color: #4caf50;
`;

const Error = styled.div`
  color: #f44336;
`;

const Container = styled.div`
  position: relative;
  overflow: hidden;
`;

const Button = styled.button`
  font-size: 13px;
  padding: 10px 20px;
  background: black;
  border: 0;
  outline: 0;
  border-radius: 3px;
  color: white;
  cursor: pointer;
  margin: 0 0 0 10px;
  display: block;
  width: 110px;
`;

const Title = styled.h1`
  font-size: 25px;
  font-weight: bold;
  text-align: center;
  margin: 0 0 40px;
  @media (max-width: 576px) {
    font-size: 20px;
  }
`;

const Wrapper = styled.div`
  border: 2px ${props => (props.dragging ? "solid #00000099" : "dashed #ddd")};
  padding: 10px;
  min-height: 162px;
  position: relative;
  overflow: hidden;
`;

const DragBox = styled.div`
  font-size: 15px;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  background: #00000099;
  color: white;
  font-weight: bold;
`;

const Items = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin: -5px;
  position: relative;
  z-index: 1;
`;

const Item = styled.div`
  width: 25%;
  height: 150px;
  padding: 5px;
  position: relative;
  overflow: hidden;
  @media (max-width: 768px) {
    width: 33.3333%;
  }
  @media (max-width: 576px) {
    width: 50%;
  }
`;

const Img = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Upload = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
`;

const UploadIcon = styled.img`
  width: 30px;
  opacity: 0.3;
`;

const UploadText = styled.p`
  font-size: 12px;
  margin: 10px 0 0;
  color: #8c8c8c;
`;

const DeleteBtn = styled.button`
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: transparent;
  border: 0;
  outline: 0 !important;
  padding: 0;
  cursor: pointer;
  height: 20px;
  width: 20px;
`;

const DeleteIcon = styled.img`
  width: 100%;
  height: 100%;
`;

const ErrorFiles = styled.div`
  font-size: 15px;
  margin: 30px 0 0;
  font-weight: bold;
`;

const ErrorFileItems = styled.ul`
  margin: 20px 0 0;
  font-size: 15px;
  line-height: 25px;
  font-weight: normal;
`;

const ErrorFileItem = styled.li``;

const InputWrapper = styled.div`
  border: 2px dashed #ddd;
  border-top: 0;
  position: relative;
  background: #f9f9f9;
  overflow: hidden;
  height: 40px;
`;

const InputFile = styled.input`
  width: 100%;
  height: 100%;
  opacity: 0;
`;

const InputText = styled.p`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  pointer-events: none;
  color: #8c8c8c;
`;

export default DragAndDrop;
