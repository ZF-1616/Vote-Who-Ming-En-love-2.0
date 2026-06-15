const SESSION_USER_KEY = "voteWhoMing_currentUser";
const VOTE_PREVIOUS_KEY = "voteWhoMing_previousVote";

window.addEventListener("load", () => {
  if (document.body.contains(document.getElementById("login-card"))) {
    initializeVotePage();
  }
});

function initializeVotePage() {
  const username = getSession();
  if (username) {
    showVotePanel(username);
  }
}

function getSession() {
  return sessionStorage.getItem(SESSION_USER_KEY);
}

function setSession(username) {
  sessionStorage.setItem(SESSION_USER_KEY, username);
}

function clearSession() {
  sessionStorage.removeItem(SESSION_USER_KEY);
  sessionStorage.removeItem(VOTE_PREVIOUS_KEY);
}

function startVoting() {
  const username = document.getElementById("login-username").value.trim();
  const message = document.getElementById("login-message");
  message.textContent = "";

  if (!username) {
    message.textContent = "Please enter your name to vote.";
    return;
  }

  setSession(username);
  showVotePanel(username);
}

function showVotePanel(username) {
  const loginCard = document.getElementById("login-card");
  const voteCard = document.getElementById("vote-card");
  const greeting = document.getElementById("greeting");
  const previousChoice = document.getElementById("previous-choice");
  const previousVote = sessionStorage.getItem(VOTE_PREVIOUS_KEY);

  if (loginCard) {
    loginCard.classList.add("hidden");
  }
  if (voteCard) {
    voteCard.classList.remove("hidden");
  }
  if (greeting) {
    greeting.textContent = `Welcome, ${username}`;
  }
  if (previousChoice) {
    previousChoice.textContent = previousVote || "none";
  }

  setSelectedVote(previousVote);
}

function logout() {
  clearSession();
  window.location.reload();
}

function vote(choice) {
  const username = getSession();
  const feedback = document.getElementById("vote-feedback");

  if (!username) {
    if (feedback) {
      feedback.textContent = "Please enter your name before voting.";
    }
    return;
  }

  const previousVote = sessionStorage.getItem(VOTE_PREVIOUS_KEY);

  if (previousVote === choice) {
    if (feedback) {
      feedback.textContent = `You already selected ${choice}.`;
    }
    setSelectedVote(choice);
    return;
  }

  sessionStorage.setItem(VOTE_PREVIOUS_KEY, choice);
  setSelectedVote(choice);

  const previousChoice = document.getElementById("previous-choice");
  if (previousChoice) {
    previousChoice.textContent = choice;
  }

  const baited = choice === "D. DON'T CLICK !!!";
  downloadSqlFile(username, choice, baited, Boolean(previousVote));

  if (feedback) {
    feedback.textContent = `Thanks, ${username}! Your vote has been recorded.${baited ? " You fell for the bait." : ""}`;
  }
}

function setSelectedVote(choice) {
  const buttons = document.querySelectorAll(".vote[data-choice]");
  buttons.forEach((button) => {
    if (button.dataset.choice === choice) {
      button.classList.add("selected");
    } else {
      button.classList.remove("selected");
    }
  });
}

function downloadSqlFile(username, choice, baited, isUpdate) {
  const escapedUser = escapeSqlString(username);
  const escapedChoice = escapeSqlString(choice);
  const baitValue = baited ? 1 : 0;
  const header = `-- Vote file generated for ${escapedUser}\n`;
  const sql = isUpdate
    ? `${header}UPDATE votes\nSET choice = '${escapedChoice}', baited = ${baitValue}, updated_at = CURRENT_TIMESTAMP\nWHERE username = '${escapedUser}';\n`
    : `${header}INSERT INTO votes (username, choice, baited, created_at)\nVALUES ('${escapedUser}', '${escapedChoice}', ${baitValue}, CURRENT_TIMESTAMP);\n`;

  const filename = `vote-${sanitizeFilename(username)}-${Date.now()}.sql`;
  const blob = new Blob([sql], { type: "text/sql" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function escapeSqlString(value) {
  return String(value).replace(/'/g, "''");
}

function sanitizeFilename(value) {
  return String(value).trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
}

function renderSecretPage() {
  const list = document.getElementById("secret-list");
  const count = document.getElementById("secret-count");
  const notice = document.getElementById("secret-notice");

  if (list) {
    list.innerHTML = "<p class='small'>This demo does not store vote records in local storage.</p>";
  }
  if (count) {
    count.textContent = "No stored accounts.";
  }
  if (notice) {
    notice.textContent = "Vote data is exported as SQL files instead.";
  }
}

