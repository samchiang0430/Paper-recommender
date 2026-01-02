document.addEventListener("DOMContentLoaded", () => {
  const paper = JSON.parse(localStorage.getItem("selectedPaper"));
  const titleEl = document.getElementById("paper-title");
  const authorsEl = document.getElementById("paper-authors");
  const abstractEl = document.getElementById("paper-abstract");
  const pdfFrame = document.getElementById("pdf-frame");

  if (paper) {
    titleEl.textContent = paper.title || "Untitled";
    authorsEl.textContent = "Authors: " + (
      Array.isArray(paper.authors) ? paper.authors.join(", ") : paper.authors
    );

    if (paper.abstract && paper.abstract !== "No abstract available") {
      abstractEl.innerHTML = "<strong>Abstract:</strong> " + paper.abstract;
    } else {
      abstractEl.textContent = "No abstract available";
    }

    const paperId = paper.paperId || "";
    if (paperId) {
      pdfFrame.src = `https://arxiv.org/pdf/${paperId}`;
    }
  }

  // Chat toggle
  const toggleChatBtn = document.getElementById("toggle-chat");
  const chatPanel = document.getElementById("chat-panel");
  const resizer = document.getElementById("resizer");

  toggleChatBtn.addEventListener("click", () => {
    chatPanel.classList.toggle("hidden");
    resizer.classList.toggle("hidden");
  });

  // Send message to server
  const chatBox = document.getElementById("chat-box");
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");

  sendBtn.addEventListener("click", async () => {
    const userInput = chatInput.value.trim();
    if (!userInput || !paper?.title) return;

    // USER message bubble
    const userMessage = document.createElement("div");
    userMessage.classList.add("chat-message", "user");
    userMessage.textContent = userInput;
    chatBox.appendChild(userMessage);

    chatInput.value = "";

    try {
      const response = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Paper title: ${paper.title}\n\nQuestion: ${userInput}`
        })
      });

      const data = await response.json();

      const botMessage = document.createElement("div");
      botMessage.classList.add("chat-message", "bot");
      botMessage.textContent = data.reply || "No answer received.";
      chatBox.appendChild(botMessage);
    } catch (error) {
      const errorMsg = document.createElement("div");
      errorMsg.classList.add("chat-message", "bot");
      errorMsg.textContent = "Error contacting server.";
      chatBox.appendChild(errorMsg);
    }

    chatBox.scrollTop = chatBox.scrollHeight;
  });

  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendBtn.click();
  });

  const container = document.querySelector(".container");
  let isResizing = false;

  resizer.addEventListener("mousedown", () => {
    isResizing = true;
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;

    const containerRect = container.getBoundingClientRect();
    const newChatWidth = containerRect.right - e.clientX;
    if (newChatWidth > 250 && newChatWidth < containerRect.width * 0.7) {
      chatPanel.style.width = `${newChatWidth}px`;
    }
  });

  document.addEventListener("mouseup", () => {
    isResizing = false;
    document.body.style.userSelect = "auto";
  });
});
