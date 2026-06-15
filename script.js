const SESSION_USER_KEY = "voteWhoMing_currentUser";
const VOTE_PREVIOUS_KEY = "voteWhoMing_previousVote";
const VOTE_ENDPOINT = "/vote";
const VOTES_ENDPOINT = "/votes";
const LOGIN_ENDPOINT = "/login";
const SIGNUP_ENDPOINT = "/signup";

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

async function login() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  const message = document.getElementById("login-message");
  message.textContent = "";

  if (!username || !password) {
    message.textContent = "Please enter both username and password.";
    return;
  }

  try {
    const response = await fetch(LOGIN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Login failed.");
    }

    setSession(data.username);
    showVotePanel(data.username);
  } catch (err) {
    message.textContent = err.message;
  }
}

async function signup() {
  const username = document.getElementById("signup-username").value.trim();
  const password = document.getElementById("signup-password").value;
  const confirm = document.getElementById("signup-confirm").value;
  const message = document.getElementById("signup-message");
  message.textContent = "";

  if (!username || !password || !confirm) {
    message.textContent = "Fill in every field to create an account.";
    return;
  }

  if (password.length < 6) {
    message.textContent = "Use at least 6 characters for your password.";
    return;
  }

  if (password !== confirm) {
    message.textContent = "Passwords do not match. Try again.";
    return;
  }

  try {
    const response = await fetch(SIGNUP_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Sign up failed.");
    }

    window.location.href = "index.html";
  } catch (err) {
    message.textContent = err.message;
  }
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

async function vote(choice) {
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

  const payload = {
    username,
    choice,
    previousVote,
    baited: choice === "D. DON'T CLICK !!!",
  };

  try {
    const response = await fetch(VOTE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to save vote.");
    }

    sessionStorage.setItem(VOTE_PREVIOUS_KEY, choice);
    setSelectedVote(choice);

    const previousChoice = document.getElementById("previous-choice");
    if (previousChoice) {
      previousChoice.textContent = choice;
    }

    if (feedback) {
      feedback.textContent = `Thanks, ${username}! Your vote has been saved.${data.baitCount > 0 ? " You fell for the bait." : ""}`;
    }
  } catch (err) {
    if (feedback) {
      feedback.textContent = `Error saving vote: ${err.message}`;
    }
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

async function renderSecretPage() {
  const list = document.getElementById("secret-list");
  const count = document.getElementById("secret-count");
  const notice = document.getElementById("secret-notice");

  if (!list || !count) return;

  try {
    const response = await fetch(VOTES_ENDPOINT);
    if (!response.ok) {
      throw new Error("Could not load saved votes.");
    }

    const votes = await response.json();
    const entries = Object.values(votes).sort((a, b) => a.username.localeCompare(b.username));

    const rows = entries
      .map((user) => {
        const history = Array.isArray(user.history) && user.history.length ? user.history.join(", ") : "NO VOTE";
        const baitSuffix = user.baitCount > 0 ? ` (fell for bait ${user.baitCount} ${user.baitCount === 1 ? "time" : "times"})` : "";
        return `<div class="secret-row"><span>${user.username}</span><span>${user.latestVote || "none"}</span><span>${history}${baitSuffix}</span></div>`;
      })
      .join("");

    list.innerHTML = rows || "<p class='small'>No saved votes yet.</p>";
    count.textContent = `Saved voters: ${entries.length}`;
    if (notice) {
      notice.textContent = `This page reads vote data from the repository-backed server file.`;
    }
  } catch (err) {
    list.innerHTML = `<p class='small'>${err.message}</p>`;
    count.textContent = "Unable to load saved votes.";
    if (notice) {
      notice.textContent = "Make sure the local server is running.";
    }
  }
}

