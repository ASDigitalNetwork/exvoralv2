const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// Sert les fichiers statiques de Vite
app.use(express.static(path.join(__dirname, "dist")));

// Route SPA fallback pour React Router
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Serveur en ligne sur http://localhost:${PORT}`);
});
