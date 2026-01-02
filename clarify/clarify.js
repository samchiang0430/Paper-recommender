let clarificationStep = 0;
let maxClarifySteps = 5;
let allUserAnswers = [];

function appendMessage(role, text) {
  const chatLog = document.getElementById("chat-log");
  const messageDiv = document.createElement("div");
  messageDiv.textContent = `${role === "user" ? "You" : "AI"}: ${text}`;
  messageDiv.style.margin = "10px 0";
  messageDiv.style.color = role === "user" ? "#500000" : "#001F3F";
  chatLog.appendChild(messageDiv);
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function sendToBackend(message) {
  try {
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();
    return data.reply || "[No response]";
  } catch (error) {
    console.error("Error:", error);
    return "[Server error]";
  }
}

async function sendClarificationPrompt() {
  const query = localStorage.getItem("userQuery") || "[No query found]";
  let prompt = "";

  if (clarificationStep === 0) {
    prompt = `A user is searching for a research paper with this query: "${query}". 
Ask one helpful clarifying question to understand what they really need. 
For example: Are they new to the area? Do they want a broad intro, a survey, or deep research? 
If you think you're ready to show relevant papers based on their input, say: 
"Got it! I’ll now show you some papers that match your interest."`;
  } else {
    const history = allUserAnswers.map((ans, i) => `Q${i + 1}: ${ans}`).join("\n");
    prompt = `Here is what the user said so far:\n${history}

Ask ONE more helpful question *only if needed* to refine what papers to recommend. 
If you're confident, say: "Got it! I’ll now show you some papers that match your interest."`;
  }

  const reply = await sendToBackend(prompt);
  appendMessage("ai", reply);

  if (reply.toLowerCase().includes("show you some papers")) {
    // Store answers and move to papers page
    localStorage.setItem("clarificationAnswers", JSON.stringify(allUserAnswers));
    window.location.href = "../papers/papers.html";
  }
}

async function handleUserInput() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (!message) return;

  appendMessage("user", message);
  input.value = "";
  allUserAnswers.push(message);
  clarificationStep++;

  if (clarificationStep < maxClarifySteps) {
    await sendClarificationPrompt();
  } else {
    // Max questions reached store and move on
    localStorage.setItem("clarificationAnswers", JSON.stringify(allUserAnswers));
    window.location.href = "../papers/papers.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  sendClarificationPrompt();

  const input = document.getElementById("user-input");
  const button = document.getElementById("send-button");

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleUserInput();
    }
  });

  button.addEventListener("click", (e) => {
    e.preventDefault();
    handleUserInput();
  });
});
