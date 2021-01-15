import React from "react";
import styled from "styled-components";

import DragAndDrop from "./DragAndDrop";
import MultipartUpload from "./Multipart";

const App = () => {
  const search = window.location.search;
  const key = search
    ? search.includes("key")
      ? search.split("=")[1]
      : ""
    : "";
  return (
    <Container>
      <DragAndDrop pass={key} />
      <MultipartUpload pass={key} />
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 50px auto;
  padding: 0 15px;
`;

export default App;
