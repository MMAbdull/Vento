import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Connecting to Vento API...");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/health`)
      .then((response) => response.json())
      .then((data) => {
        setMessage(data.message);
      })
      .catch(() => {
        setMessage("Failed to connect to Vento API");
      });
  }, []);

  return (
    <div>
      <h1>Vento</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;