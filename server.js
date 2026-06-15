const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "votes.json");

function loadVotes() {
  try {
    const content = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(content);
  } catch (err) {
    if (err.code === "ENOENT") {
      return {};
    }
    console.error("Failed to read votes file:", err);
    return {};
  }
}

function saveVotes(votes) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(votes, null, 2), "utf8");
}

function sendJson(res, status, data) {
  const payload = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function sendFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

function getContentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html";
  if (filePath.endsWith(".js")) return "application/javascript";
  if (filePath.endsWith(".css")) return "text/css";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".mp3")) return "audio/mpeg";
  if (filePath.endsWith(".json")) return "application/json";
  return "application/octet-stream";
}

const server = http.createServer((req, res) => {
  const method = req.method;
  const url = req.url.split("?")[0];

  if (method === "GET" && url === "/") {
    sendFile(res, path.join(__dirname, "index.html"), "text/html");
    return;
  }

  if (method === "GET" && url === "/signup.html") {
    sendFile(res, path.join(__dirname, "signup.html"), "text/html");
    return;
  }

  if (method === "GET" && url === "/secret-votes.html") {
    sendFile(res, path.join(__dirname, "secret-votes.html"), "text/html");
    return;
  }

  if (method === "GET" && url === "/style.css") {
    sendFile(res, path.join(__dirname, "style.css"), "text/css");
    return;
  }

  if (method === "GET" && url === "/script.js") {
    sendFile(res, path.join(__dirname, "script.js"), "application/javascript");
    return;
  }

  if (method === "GET" && url.startsWith("/attached_assets/")) {
    sendFile(res, path.join(__dirname, url), getContentType(url));
    return;
  }

  if (method === "GET" && url === "/votes") {
    const votes = loadVotes();
    sendJson(res, 200, votes);
    return;
  }

  if (method === "POST" && url === "/vote") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const username = String(payload.username || "").trim();
        const choice = String(payload.choice || "").trim();
        const baited = Boolean(payload.baited);
        const previousVote = payload.previousVote ? String(payload.previousVote).trim() : null;

        if (!username || !choice) {
          sendJson(res, 400, { error: "Missing username or choice." });
          return;
        }

        const votes = loadVotes();
        const key = username.toLowerCase();
        const user = votes[key] || {
          username,
          history: [],
          baitCount: 0,
          latestVote: null,
        };

        if (!user.history || !Array.isArray(user.history)) {
          user.history = [];
        }

        if (!previousVote || previousVote !== choice) {
          user.history.push(choice);
        }

        if (baited) {
          user.baitCount = (user.baitCount || 0) + 1;
        }

        user.latestVote = choice;
        votes[key] = user;
        saveVotes(votes);

        sendJson(res, 200, { success: true, baitCount: user.baitCount });
      } catch (err) {
        sendJson(res, 500, { error: "Invalid request payload." });
      }
    });

    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
