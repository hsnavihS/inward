import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VaultProvider } from "./context/VaultContext";
import Home from "./pages/Home";
import CreateEntry from "./pages/CreateEntry";
import EntryDetail from "./pages/EntryDetail";

export default function App() {
  return (
    <VaultProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateEntry />} />
          <Route path="/entry/:id" element={<EntryDetail />} />
        </Routes>
      </BrowserRouter>
    </VaultProvider>
  );
}
