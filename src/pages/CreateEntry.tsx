// routing
import { useNavigate } from "react-router-dom";

// context
import { useEntries } from "../context/EntriesContext";

// components
import EntryForm from "../components/EntryForm";

export default function CreateEntry() {
  const { addEntry } = useEntries();
  const navigate = useNavigate();

  return (
    <div>
      <h1>New Entry</h1>
      <EntryForm
        onSubmit={({ title, body, tags }) => {
          const entry = addEntry({ title, body, tags, imageIds: [] });
          navigate(`/entry/${entry.id}`);
        }}
        onCancel={() => navigate("/")}
      />
    </div>
  );
}
