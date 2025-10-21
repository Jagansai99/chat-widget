import React from "react";
import ReactDOM from "react-dom/client";
import ChatWidget from "./components/ChatWidget";

(function () {
 let container = document.getElementById("chat-widget-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "chat-widget-container";
    document.body.appendChild(container);
  }
  const botReposition = container.getAttribute("botReposition")
  const root = ReactDOM.createRoot(container);
  root.render(<ChatWidget botReposition={botReposition}/>);
})();
