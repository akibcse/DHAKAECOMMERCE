import { useState, useEffect, useRef } from "react";
import { BsSend } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";

const ChatBox = ({ messages, onSendMessage, currentUserRole, currentUserEmail, loading }) => {
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            await onSendMessage(newMessage.trim());
            setNewMessage("");
        } catch (error) {
            alert("Failed to send message");
        }
        setSending(false);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 rounded-lg">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[500px]">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-gray-400">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {messages.map((message) => {
                            const isCurrentUser = message.senderRole === currentUserRole;
                            return (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                                >
                                    <div className={`max-w-[70%] ${isCurrentUser ? "text-right" : "text-left"}`}>
                                        <div
                                            className={`inline-block px-4 py-2 rounded-lg ${isCurrentUser
                                                    ? "bg-primary text-white"
                                                    : "bg-white text-gray-800 border border-gray-200"
                                                }`}
                                        >
                                            <p className="text-sm break-words">{message.text}</p>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {message.senderRole === "admin" ? "Shop" : "You"} •{" "}
                                            {new Date(message.timestamp).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-primary"
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="bg-primary text-white p-3 rounded-full hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <BsSend size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatBox;
