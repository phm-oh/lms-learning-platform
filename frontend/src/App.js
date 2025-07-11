// frontend/src/App.js
import React from "react";
import { Button, Card, Input, Layout } from "./components/ui";
import { ComponentShowcase } from "./components";

function App() {
  return (
    <div >
      
      <Layout userRole="student">
        <h1> Phanumet</h1>
        <ComponentShowcase />
      </Layout>
    </div>
  );
}

export default App;
