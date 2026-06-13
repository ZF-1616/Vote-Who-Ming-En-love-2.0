function login() {
  var username = document.getElementById("username").value.trim();
  if (username === "") {
    alert("Please enter your name first!");
    return;
  }
  alert("Welcome, " + username + "! Now vote below.");
}

function sus() {
  alert("Sus choice! Your vote has been counted.");
}

function Jumpscare() {
  var jumpScare = document.querySelector(".jump-scare");
  jumpScare.style.display = "block";
  setTimeout(function () {
    jumpScare.style.display = "none";
  }, 2000);
}
