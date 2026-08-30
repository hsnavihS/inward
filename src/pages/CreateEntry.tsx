// routing
import { useNavigate } from "react-router-dom";

// context
import { useEntries } from "../context/EntriesContext";

// components
import Navbar from "../components/Navbar";
import EntryForm from "../components/EntryForm";

export default function CreateEntry() {
  const { addEntry } = useEntries();
  const navigate = useNavigate();

  return (
    <div className="page-full">
      <Navbar left={<button onClick={() => navigate(-1)}>back</button>} />
      <h1>New Entry</h1>
        <EntryForm
          onSubmit={({ title, body, tags, images }) => {
            const entry = addEntry({ title, body, tags, images });
            navigate(`/entry/${entry.id}`);
          }}
          onCancel={() => navigate("/")}
        />
    </div>
  );
}
