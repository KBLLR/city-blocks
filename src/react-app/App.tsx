import { BrowserRouter as Router, Routes, Route } from "react-router";
import HomePage from "@/react-app/pages/Home";
import { ApiKeysProvider } from "@/react-app/context/ApiKeysProvider";

export default function App() {
  return (
    <ApiKeysProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </Router>
    </ApiKeysProvider>
  );
}
