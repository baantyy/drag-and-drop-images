import React from 'react';
import styled from 'styled-components';
import DragAndDrop from './DragAndDrop';

const App = () => {
  return (
    <Container>
      <DragAndDrop />
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