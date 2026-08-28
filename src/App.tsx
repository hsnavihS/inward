import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VaultProvider } from "./context/VaultContext";
import { EntriesProvider } from "./context/EntriesContext";
import { TagsProvider } from "./context/TagsContext";
import Home from "./pages/Home";
import CreateEntry from "./pages/CreateEntry";
import EntryDetail from "./pages/EntryDetail";

export default function App() {
  return (
    <VaultProvider>
      <EntriesProvider>
        <TagsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<CreateEntry />} />
              <Route path="/entry/:id" element={<EntryDetail />} />
            </Routes>
          </BrowserRouter>
        </TagsProvider>
      </EntriesProvider>
    </VaultProvider>
  );
}
