import React, { Component } from 'react';
import styled from 'styled-components';
const uuid4 = require('uuid4');

const laodingIcon = require('./loading.gif');
const deleteIcon = require('./close.svg');
const uploadIcon = require('./upload.svg');

class DragAndDrop extends Component {
  constructor(props){
    super(props);
    this.dragCounter = 0;
    this.state = {
      dragging: false,
      files: [],
      fileTypes: [
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/svg+xml',
      ],
      ignoredFiles: []
    };
  };

  componentDidMount() {
    const div = this.dropRef;
    div.addEventListener('dragenter', this.handleDragIn);
    div.addEventListener('dragleave', this.handleDragOut);
    div.addEventListener('dragover', this.handleDrag);
    div.addEventListener('drop', this.handleDrop);
  };

  componentWillUnmount() {
    const div = this.dropRef;
    div.removeEventListener('dragenter', this.handleDragIn);
    div.removeEventListener('dragleave', this.handleDragOut);
    div.removeEventListener('dragover', this.handleDrag);
    div.removeEventListener('drop', this.handleDrop);
  };

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
          preview: '',
        });
      } else {
        ignoredFiles.push(files[i].name);
      }
    };
    this.setState(prevState => ({
      files: [...prevState.files, ...newFiles],
      ignoredFiles
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
            })
          }));
        });
        reader.readAsDataURL(file.file);
      }
    });
  };

  shouldComponentUpdate(nextProps, nextState){
    if (nextState.files.length > this.state.files.length) {
     this.previewImages(nextState.files);
    }
    return true;
  };

  removeFile = id => {
    this.setState(prevState => ({
      files: prevState.files.filter(item => item.id !== id)
    }));
  };

  render() {
    const { files, dragging, ignoredFiles } = this.state;
    return (
      <Container>
        <Title>Drag and Drop Images</Title>
        <Wrapper ref={e => this.dropRef = e} dragging={dragging}>
          {dragging && <DragBox>Drop here</DragBox>}
          <Items>
            {files.map(item => (
              <Item key={item.id}>
                <Img src={item.preview || laodingIcon} />
                {item.preview &&
                  <DeleteBtn onClick={() => { this.removeFile(item.id) }}>
                    <DeleteIcon src={deleteIcon} />
                  </DeleteBtn>
                }
              </Item>
            ))}
          </Items>
          {(files.length === 0 && !dragging) && (
            <Upload>
              <UploadIcon src={uploadIcon} />
              <UploadText>Drag and drop images here</UploadText>
            </Upload>
          )}
        </Wrapper>
        <InputWrapper>
            <Input type="file" onChange={this.handleChange} multiple />
            <InputText>Click here to add images</InputText>
        </InputWrapper>
        {ignoredFiles.length > 0 &&
          <ErrorFiles>
            Following files are not allowed - 
            <ErrorFileItems>
              {ignoredFiles.map((item, index) => (
                <ErrorFileItem key={index}>{item}</ErrorFileItem>
              ))}
            </ErrorFileItems>
          </ErrorFiles>
        }
      </Container>
    );
  };
};

const Container = styled.div`
  position: relative;
  overflow: hidden;
`;

const Title = styled.h1`
  font-size: 25px;
  font-weight: bold;
  text-align: center;
  margin: 0 0 40px;
  @media (max-width: 576px){
    font-size: 20px;
  }
`;

const Wrapper = styled.div`
  border: 2px ${props => props.dragging ? 'solid #00000099' : 'dashed #ddd'};
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
  @media (max-width: 768px){
    width: 33.3333%;
  }
  @media (max-width: 576px){
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
  transform: translate(-50%,-50%);
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

const Input = styled.input`
  width: 100%;
  height: 100%;
  opacity: 0;
`;

const InputText = styled.p`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%);
  font-size: 12px;
  pointer-events: none;
  color: #8c8c8c;
`;

export default DragAndDrop;