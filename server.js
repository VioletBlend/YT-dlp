const express = require("express");
const fs = require("fs");
const path = require("path");
const ytdl = require("@distube/ytdl-core");

const app = express();
const counterPath = path.join(__dirname, "counter.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function getNextFilename(requestedName) {
  if (requestedName) {
    const safe = requestedName.replace(/[^\w\-\.]/g, "_");
    return safe.endsWith(".mp4") ? safe : safe + ".mp4";
  }
  let count = 0;
  if (fs.existsSync(counterPath)) {
    const data = JSON.parse(fs.readFileSync(counterPath, "utf8"));
    count = data.count ?? 0;
  }
  const filename = String(count).padStart(2, "0") + ".mp4";
  fs.writeFileSync(counterPath, JSON.stringify({ count: count + 1 }));
  return filename;
}

app.post("/download", async (req, res) => {
  const { url, filename: requested } = req.body;
  if (!ytdl.validateURL(url)) return res.status(400).send("無効なURLです");

  try {
    const filename = getNextFilename(requested);
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    ytdl(url, {
      quality: "highest",
      filter: "audioandvideo" // ✅ 映像＋音声
    }).pipe(res);
  } catch (e) {
    console.error("ダウンロード失敗", e);
    res.status(500).send("サーバーエラー");
  }
});

app.post("/reset", (req, res) => {
  fs.writeFileSync(counterPath, JSON.stringify({ count: 0 }));
  res.send("連番カウンターを00にリセットしました");
});

app.listen(3000, () => {
  console.log("✅ サーバー起動中 http://localhost:3000");
});
