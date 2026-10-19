const checkInForm = document.getElementById("checkInForm");
const attendeeNameInput = document.getElementById("attendeeName");
const teamSelect = document.getElementById("teamSelect");
const greeting = document.getElementById("greeting");
const checkInButton = document.getElementById("checkInBtn");
const attendeeCount = document.getElementById("attendeeCount");
const progressBar = document.getElementById("progressBar");
const confettiContainer = document.getElementById("confettiContainer");
const celebration = document.getElementById("celebration");
const winningTeamPlural = document.getElementById("winningTeamPlural");
const winningTeamName = document.getElementById("winningTeamName");
const waterCount = document.getElementById("waterCount");
const zeroCount = document.getElementById("zeroCount");
const powerCount = document.getElementById("powerCount");
const attendeeList = document.getElementById("attendeeList");
const pollResetButton = document.getElementById("pollResetButton");

const attendanceGoal = 60;
const attendanceStorageKey = "eventCheckInCounts";
const pollResetPin = "0000";

let totalAttendees = 0;
let waterAttendees = 0;
let zeroAttendees = 0;
let powerAttendees = 0;
let goalCelebrationShown = false;
let attendees = [];

function showStorageError(message) {
  greeting.textContent = message;
  greeting.classList.remove("success-message");
  greeting.classList.add("error-message");
  greeting.style.display = "block";
}

pollResetButton.addEventListener("click", function () {
  const enteredPin = window.prompt("Enter the admin PIN to reset the poll:");

  if (enteredPin === null) {
    return;
  }

  if (enteredPin !== pollResetPin) {
    window.alert("Incorrect PIN. The poll was not reset.");
    return;
  }

  if (!window.confirm("Reset the poll and permanently clear all saved attendance and attendee names?")) {
    return;
  }

  try {
    localStorage.removeItem(attendanceStorageKey);
    window.location.reload();
  } catch (error) {
    showStorageError("The poll could not be reset because browser storage is unavailable.");
  }
});

function updateAttendanceDisplay() {
  attendeeCount.textContent = totalAttendees;
  waterCount.textContent = waterAttendees;
  zeroCount.textContent = zeroAttendees;
  powerCount.textContent = powerAttendees;
  progressBar.style.width = `${Math.min((totalAttendees / attendanceGoal) * 100, 100)}%`;
}

function updateAttendeeList() {
  attendeeList.textContent = "";

  if (attendees.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.classList.add("empty-attendee-list");
    emptyMessage.textContent = "No attendees checked in yet.";
    attendeeList.appendChild(emptyMessage);
    return;
  }

  for (let index = 0; index < attendees.length; index++) {
    const attendeeItem = document.createElement("li");
    const attendeeName = document.createElement("span");
    const attendeeTeam = document.createElement("span");

    attendeeName.classList.add("attendee-name");
    attendeeTeam.classList.add("attendee-team");
    attendeeName.textContent = attendees[index].name;
    attendeeTeam.textContent = attendees[index].team;
    attendeeItem.appendChild(attendeeName);
    attendeeItem.appendChild(attendeeTeam);
    attendeeList.appendChild(attendeeItem);
  }
}

function saveAttendanceCounts(counts) {
  try {
    localStorage.setItem(attendanceStorageKey, JSON.stringify(counts));
    return true;
  } catch (error) {
    showStorageError("Attendance could not be saved in this browser. Please check your browser storage settings and try again.");
    return false;
  }
}

function loadAttendanceCounts() {
  let savedCounts;
  const teamNames = ["Team Water Wise", "Team Net Zero", "Team Renewables"];

  try {
    const storedCounts = localStorage.getItem(attendanceStorageKey);
    if (storedCounts === null) {
      return true;
    }

    savedCounts = JSON.parse(storedCounts);
  } catch (error) {
    showStorageError("Saved attendance could not be read. Check your browser storage settings or clear the invalid saved attendance data.");
    return false;
  }

  if (
    savedCounts === null ||
    typeof savedCounts !== "object" ||
    Array.isArray(savedCounts) ||
    !Number.isInteger(savedCounts.totalAttendees) ||
    !Number.isInteger(savedCounts.waterAttendees) ||
    !Number.isInteger(savedCounts.zeroAttendees) ||
    !Number.isInteger(savedCounts.powerAttendees) ||
    savedCounts.totalAttendees < 0 ||
    savedCounts.waterAttendees < 0 ||
    savedCounts.zeroAttendees < 0 ||
    savedCounts.powerAttendees < 0 ||
    savedCounts.totalAttendees !== savedCounts.waterAttendees + savedCounts.zeroAttendees + savedCounts.powerAttendees
  ) {
    showStorageError("Saved attendance data is invalid. Clear the invalid saved attendance data in your browser storage before checking in.");
    return false;
  }

  if (savedCounts.attendees !== undefined && !Array.isArray(savedCounts.attendees)) {
    showStorageError("Saved attendee details are invalid. Clear the invalid saved attendance data in your browser storage before checking in.");
    return false;
  }

  if (savedCounts.attendees !== undefined) {
    for (let index = 0; index < savedCounts.attendees.length; index++) {
      const attendee = savedCounts.attendees[index];
      if (
        attendee === null ||
        typeof attendee !== "object" ||
        typeof attendee.name !== "string" ||
        attendee.name.trim() === "" ||
        teamNames.indexOf(attendee.team) === -1
      ) {
        showStorageError("Saved attendee details are invalid. Clear the invalid saved attendance data in your browser storage before checking in.");
        return false;
      }
    }
  }

  totalAttendees = savedCounts.totalAttendees;
  waterAttendees = savedCounts.waterAttendees;
  zeroAttendees = savedCounts.zeroAttendees;
  powerAttendees = savedCounts.powerAttendees;
  attendees = savedCounts.attendees || [];
  return true;
}

function showGoalCelebration(withConfetti) {
  let winningTeams = [];
  let winningTeamCount = waterAttendees;

  winningTeams.push("Team Water Wise");

  if (zeroAttendees > winningTeamCount) {
    winningTeams = ["Team Net Zero"];
    winningTeamCount = zeroAttendees;
  } else if (zeroAttendees === winningTeamCount) {
    winningTeams.push("Team Net Zero");
  }

  if (powerAttendees > winningTeamCount) {
    winningTeams = ["Team Renewables"];
    winningTeamCount = powerAttendees;
  } else if (powerAttendees === winningTeamCount) {
    winningTeams.push("Team Renewables");
  }

  winningTeamPlural.textContent = winningTeams.length > 1 ? "s" : "";
  winningTeamName.textContent = `${winningTeams.join(" and ")} (${winningTeamCount} check-ins)`;
  celebration.hidden = false;
  goalCelebrationShown = true;

  if (withConfetti) {
    showConfetti();
  }
}

function showConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const confettiColors = ["#0071c5", "#00aeef", "#f5b700", "#37a76f", "#f97316"];

  for (let index = 0; index < 80; index++) {
    const confettiPiece = document.createElement("span");
    const confettiColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];

    confettiPiece.classList.add("confetti-piece");
    confettiPiece.style.left = `${Math.random() * 100}%`;
    confettiPiece.style.setProperty("--confetti-color", confettiColor);
    confettiPiece.style.setProperty("--confetti-drift", `${Math.random() * 200 - 100}px`);
    confettiPiece.style.animationDuration = `${3 + Math.random() * 2}s`;
    confettiPiece.style.animationDelay = `${Math.random()}s`;
    confettiPiece.addEventListener("animationend", function () {
      confettiPiece.remove();
    });

    confettiContainer.appendChild(confettiPiece);
  }
}

let storageReady = loadAttendanceCounts();

if (storageReady) {
  updateAttendanceDisplay();
  updateAttendeeList();
  if (totalAttendees >= attendanceGoal) {
    showGoalCelebration(false);
  }
} else {
  checkInButton.disabled = true;
}

checkInForm.addEventListener("submit", function (event) {
  event.preventDefault();

  if (!storageReady) {
    return;
  }

  const attendeeName = attendeeNameInput.value.trim();
  let attendeeTeam = "";

  if (attendeeName === "") {
    return;
  }

  const updatedCounts = {
    totalAttendees: totalAttendees + 1,
    waterAttendees: waterAttendees,
    zeroAttendees: zeroAttendees,
    powerAttendees: powerAttendees
  };
  if (teamSelect.value === "water") {
    updatedCounts.waterAttendees++;
    attendeeTeam = "Team Water Wise";
  } else if (teamSelect.value === "zero") {
    updatedCounts.zeroAttendees++;
    attendeeTeam = "Team Net Zero";
  } else if (teamSelect.value === "power") {
    updatedCounts.powerAttendees++;
    attendeeTeam = "Team Renewables";
  }

  if (attendeeTeam === "") {
    return;
  }

  const updatedAttendees = attendees.slice();
  updatedAttendees.push({ name: attendeeName, team: attendeeTeam });
  updatedCounts.attendees = updatedAttendees;

  if (!saveAttendanceCounts(updatedCounts)) {
    return;
  }

  totalAttendees = updatedCounts.totalAttendees;
  waterAttendees = updatedCounts.waterAttendees;
  zeroAttendees = updatedCounts.zeroAttendees;
  powerAttendees = updatedCounts.powerAttendees;
  attendees = updatedAttendees;
  updateAttendanceDisplay();
  updateAttendeeList();

  if (totalAttendees >= attendanceGoal && !goalCelebrationShown) {
    showGoalCelebration(true);
  }

  greeting.textContent = `Welcome, ${attendeeName}! You are checked in.`;
  greeting.classList.add("success-message");
  greeting.classList.remove("error-message");
  greeting.style.display = "block";

  checkInForm.reset();
});
