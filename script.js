const overlay = document.createElement('div');
var username = document.getElementById("username").value.trim();

overlay.id = 'overlay';
document.body.appendChild(overlay);

function login() {
  if (username === "") {
    alert("Please enter your name first!");
    return;
  }
  alert("Welcome, " + username + "! Now vote below.");
}

function sus() {
  if (username === "") {
    alert("Please enter your name first!");
    return;
  }
  alert("Sus choice! Your vote has been counted.");
}

function Jumpscare() {
  var jumpScare = document.querySelector(".jump-scare");
  jumpScare.style.display = "block";
  setTimeout(function () {
    jumpScare.style.display = "none";
    overlay.style.display = 'none';
  }, 2000);
  overlay.style.display = 'block';
}
