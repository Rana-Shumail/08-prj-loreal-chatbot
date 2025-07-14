/* Get DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

/* Store chat messages for conversation context */
let messages = [
  {
    role: "system",
    content:
      "You are a helpful assistant that helps users discover and understand L’Oréal’s products—makeup, skincare, haircare, and fragrances—and provide personalized routines and recommendations. If the user asks about anything else, reply: 'Sorry, I can only help with L’Oréal products, routines, and recommendations.'",
  },
];

/* Show initial greeting */
chatWindow.innerHTML = `<div class="msg ai">👋 Hello! How can I help you today?</div>`;

/* Add a message to the chat window */
function addMessage(text, sender) {
  // sender: "user" or "ai"
  const msgDiv = document.createElement("div");
  msgDiv.className = `msg ${sender}`;
  msgDiv.textContent = text;
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Get AI response from OpenAI API */
async function getAIResponse(userText) {
  // Add user message to conversation
  messages.push({ role: "user", content: userText });

  // Show loading message
  addMessage("Thinking...", "ai");

  // Use Cloudflare Worker endpoint for API requests
  const apiUrl = "https://royal-sun-5a0c.ahmadshumail47.workers.dev/";
  // No need for API key in frontend when using Worker

  // Prepare request body
  // max_tokens controls the length of the AI's reply. Higher value = longer replies.
  const body = {
    messages: messages,
    max_tokens: 800, // Increased from 300 to 800 for longer, complete responses
  };

  try {
    // Make API request
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Check if response is OK
    if (!response.ok) {
      const loadingMsg = chatWindow.querySelector(".msg.ai:last-child");
      if (loadingMsg && loadingMsg.textContent === "Thinking...") {
        chatWindow.removeChild(loadingMsg);
      }
      addMessage(`Error: ${response.status} ${response.statusText}`, "ai");
      return;
    }

    const data = await response.json();

    // Remove loading message
    const loadingMsg = chatWindow.querySelector(".msg.ai:last-child");
    if (loadingMsg && loadingMsg.textContent === "Thinking...") {
      chatWindow.removeChild(loadingMsg);
    }

    // Check if response contains choices
    if (
      !data.choices ||
      !Array.isArray(data.choices) ||
      !data.choices[0] ||
      !data.choices[0].message ||
      !data.choices[0].message.content
    ) {
      addMessage("Sorry, the AI did not return a valid response.", "ai");
      return;
    }

    // Get AI reply
    const aiReply = data.choices[0].message.content;

    // Show AI reply and add to conversation
    addMessage(aiReply, "ai");
    messages.push({ role: "assistant", content: aiReply });
  } catch (error) {
    const loadingMsg = chatWindow.querySelector(".msg.ai:last-child");
    if (loadingMsg && loadingMsg.textContent === "Thinking...") {
      chatWindow.removeChild(loadingMsg);
    }
    addMessage("Network error: " + error.message, "ai");
  }
}

/* Handle form submit */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const text = userInput.value.trim();
  if (!text) return;

  // Show user message
  addMessage(text, "user");

  // Clear input field
  userInput.value = "";

  // Get AI response
  getAIResponse(text);
});
