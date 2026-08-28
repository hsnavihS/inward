import { useParams } from "react-router-dom";

export default function EntryDetail() {
  const { id } = useParams<{ id: string }>();
  return <h1>Entry: {id}</h1>;
}
