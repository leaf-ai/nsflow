import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { FaDownload, FaRegStopCircle } from "react-icons/fa";
import { ImBin2 } from "react-icons/im";
import { useChatControls } from "../hooks/useChatControls";
import { Clipboard } from "lucide-react"; // Small copy icon
import { useChatContext } from "../context/ChatContext";

const ChatPanel = ({ title = "Chat" }: { title?: string }) => {
  const { activeNetwork, chatMessages, addChatMessage, chatWs } = useChatContext();
  const { stopWebSocket, clearChat } = useChatControls();
  const [newMessage, setNewMessage] = useState("");
  const [copiedMessage, setCopiedMessage] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Reference for auto-scroll

  useEffect(() => {
    // Auto-scroll to latest message
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    if (!chatWs || chatWs.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected. Unable to send message.");
      return;
    }

    addChatMessage({ sender: "user", text: newMessage, network: activeNetwork });

    console.log(`Sending message: ${newMessage}`);
    chatWs.send(JSON.stringify({ message: newMessage }));
    setNewMessage("");
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMessage(index);
      setTimeout(() => setCopiedMessage(null), 1000);
    });
  };

  const downloadMessages = () => {
    const logText = chatMessages
      .map((msg) => `${msg.sender}: ${msg.text}`)
      .join("\n");

    const blob = new Blob([logText], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "chat_logs.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="chat-panel flex flex-col h-full p-4">
      {/* Title with Download Button */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold">{title}</h2>
        <button
          onClick={downloadMessages}
          className="text-gray-400 hover:text-white p-1"
          title="Download Messages"
        >
          <FaDownload size={18} />
        </button>
      </div>

      {/* Chat messages container (Scrollable) */}
      <div className="flex-grow overflow-y-auto p-2 space-y-2 bg-gray-900 rounded-md max-h-[70vh]">
        {chatMessages.map((msg, index) => (
          <div
            key={index}
            className={`relative p-2 rounded-md text-sm ${
              msg.sender === "user"
                ? "bg-blue-600 text-white self-end"
                : msg.sender === "agent"
                ? "bg-gray-700 text-gray-100"
                : "bg-gray-800 text-gray-400"
            }`}
          >
            {/* Sender Header */}
            <div className="font-bold mb-1 flex justify-between items-center">
              <span>
                {msg.sender === "user"
                  ? "User"
                  : msg.sender === "agent"
                  ? msg.network || "Unknown Agent"
                  : "System"}
              </span>

              {/* Copy Icon */}
              <button
                onClick={() => copyToClipboard(msg.text, index)}
                className="text-gray-400 hover:text-white ml-2 p-1"
                title="Copy to clipboard"
              >
                <Clipboard size={10} />
              </button>
            </div>

            {/* Message Content */}
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={{
                // Headings (H1 - H6)
                h1: ({ children }) => <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-semibold mt-3 mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-semibold mt-2 mb-1">{children}</h3>,
                // Lists
                ul: ({ children }) => <ul className="list-disc ml-6">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-6">{children}</ol>,
                li: ({ children }) => <li className="ml-2">{children}</li>,
                // Paragraphs
                p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                strong: ({ children }) => <strong className="font-bold text-gray-200">{children}</strong>,
                em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
              }}
            >
              {msg.text}
            </ReactMarkdown>

            {/* Copied Tooltip */}
            {copiedMessage === index && (
              <div className="absolute top-0 right-6 bg-gray-800 text-white text-xs p-1 rounded-md">
                Copied!
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} /> {/* Auto-scroll reference */}
      </div>

      {/* Stop Chat Button (Bottom Right) */}
      <div className="flex justify-end space-x-2 mt-1">
        <button
          onClick={stopWebSocket}
          className="bg-white-700 hover:bg-orange-400 text-white p-1 rounded-md"
          title="Stop Chat"
        >
          <FaRegStopCircle size={12} />
        </button>
        <button
          onClick={clearChat}
          className="bg-white-700 hover:bg-red-500 text-white p-1 rounded-md"
          title="Clear Chat"
        >
          <ImBin2 size={12} />
        </button>
      </div>

      {/* Chat Input (Fixed) */}
      <div className="chat-input mt-2 flex gap-2 items-end">
        <textarea
            placeholder="Type a message..."
            className="chat-input-box bg-gray-700 text-white p-2 rounded-md flex-grow resize-y min-h-20 max-h-40 overflow-y-auto"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); // Prevents new line from being added
                sendMessage();
              }
            }}
        />
        <button onClick={sendMessage} className="chat-send-btn bg-blue-600 text-white px-4 py-2 p-2 rounded-md min-h-[60px] h-auto">
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
