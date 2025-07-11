// frontend/src/App.js
import React from "react";
import { Button, Card, Input, Layout } from "./components/ui";
import { ComponentShowcase } from "./components";

function App() {
  return (
    <div className="group card-course">
      <div className="group-hover:text-purple-600">
        ไอ้นี่จะเปลี่ยนสีเมื่อแม่ hover
      </div>
      <Layout userRole="student">
        <h1> Phanumet</h1>
        <ComponentShowcase />
      </Layout>
    </div>
  );
}

export default App;
