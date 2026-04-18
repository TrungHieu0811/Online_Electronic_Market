import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendChatMessage } from '@/services/chatService';

const ChatBox = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const token = localStorage.getItem('token');

    const defaultMsg = [{ text: "Hello! I'm ElectroMart AI. How can I help you today?", sender: 'bot' }];

    // 1. Khởi tạo State ban đầu
    const [messages, setMessages] = useState(() => {
        const savedData = sessionStorage.getItem('chat_session');
        if (!savedData) return defaultMsg;

        const { items, timestamp, savedToken } = JSON.parse(savedData);

        // Logic kiểm tra Guest hết hạn (10 phút)
        if (!token && (Date.now() - timestamp > 10 * 60 * 1000)) return defaultMsg;

        // Logic kiểm tra nếu token hiện tại khác với token lúc lưu (Đăng nhập/Đăng xuất/Đổi user)
        if (savedToken !== token) return defaultMsg;

        return items;
    });

    // 2. THEO DÕI SỰ THAY ĐỔI TOKEN (Quan trọng nhất)
    // Khi token thay đổi (User Login/Logout), ép buộc xóa hội thoại cũ ngay lập tức
    useEffect(() => {
        const savedData = sessionStorage.getItem('chat_session');
        if (savedData) {
            const { savedToken } = JSON.parse(savedData);
            if (savedToken !== token) {
                setMessages(defaultMsg);
                sessionStorage.removeItem('chat_session');
            }
        }
    }, [token]); // Chạy mỗi khi token trong localStorage thay đổi hoặc component re-render

    // 3. Lưu Session Storage
    useEffect(() => {
        const dataToSave = {
            items: messages,
            timestamp: Date.now(),
            savedToken: token
        };
        sessionStorage.setItem('chat_session', JSON.stringify(dataToSave));
    }, [messages, token]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = { text: input, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            const response = await sendChatMessage(input);
            setMessages(prev => [...prev, { text: response, sender: 'bot' }]);
        } catch (error) {
            setMessages(prev => [...prev, { text: "System Error. Please try again.", sender: 'bot' }]);
        } finally {
            setIsTyping(false);
        }
    };

    // 2. Hàm Render nội dung tin nhắn (Xử lý Card và Bảng có Link)

    const renderMessageContent = (text, sender) => {
        if (sender === 'user') return <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>;

        // Regex cải tiến để bắt chính xác thẻ [ID:...]
        const productRegex = /\[ID:([\w-]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g;
        const elements = [];
        let lastIndex = 0;
        let match;

        while ((match = productRegex.exec(text)) !== null) {
            // Render văn bản trước card
            if (match.index > lastIndex) {
                elements.push(
                    <ReactMarkdown key={`text-${match.index}`} remarkPlugins={[remarkGfm]}>
                        {text.substring(lastIndex, match.index)}
                    </ReactMarkdown>
                );
            }

            const [full, slug, imageUrl, name, price] = match;

            // Render Card sản phẩm
            elements.push(
                <div key={`card-${slug}-${match.index}`}
                    style={{ border: '1px solid #eee', borderRadius: '10px', padding: '15px', margin: '10px 0', background: 'white', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                    <img src={imageUrl === "no image" ? "https://via.placeholder.com/150" : imageUrl}
                        alt={name}
                        style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#333' }}>{name}</div>
                        <div style={{ color: '#d32f2f', fontWeight: 'bold', margin: '5px 0' }}>{price}</div>
                        <button
                            onClick={() => window.location.href = `/products/${slug}`}
                            style={{ background: '#1a73e8', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '15px', cursor: 'pointer', fontSize: '12px' }}
                        >
                            View Details
                        </button>
                    </div>
                </div>
            );
            lastIndex = productRegex.lastIndex;
        }

        // Render văn bản còn lại
        if (lastIndex < text.length) {
            elements.push(
                <ReactMarkdown key="text-end" remarkPlugins={[remarkGfm]}>
                    {text.substring(lastIndex)}
                </ReactMarkdown>
            );
        }
        return elements;
    };

    useEffect(() => {
        if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping, isOpen]);

    if (!isOpen) {
        return (
            <div onClick={() => setIsOpen(true)} style={{ position: 'fixed', bottom: '20px', right: '20px', width: '60px', height: '60px', borderRadius: '50%', background: '#1a73e8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 999999, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                <svg width="28" height="28" fill="white" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
            </div>
        );
    }

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', width: '350px', height: '500px', background: 'white', borderRadius: '15px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', zIndex: 999999, overflow: 'hidden', border: '1px solid #e0e0e0', fontFamily: 'sans-serif' }}>
            {/* CSS ĐỊNH DẠNG BẢNG SO SÁNH TRONG KHUNG TRẮNG */}
            <style>{`
                table {
                    border-collapse: separate;
                    border-spacing: 0;
                    width: 100%;
                    margin: 10px 0;
                    background-color: white;
                    border-radius: 8px;
                    border: 1px solid #dee2e6;
                    overflow: hidden;
                }
                table th, table td {
                    border-bottom: 1px solid #dee2e6;
                    border-right: 1px solid #dee2e6;
                    padding: 10px;
                    text-align: left;
                    font-size: 12px;
                }
                table th {
                    background-color: #f8f9fa;
                    color: #333;
                    font-weight: bold;
                }
                table td:last-child, table th:last-child {
                    border-right: none;
                }
                table tr:last-child td {
                    border-bottom: none;
                }
                @keyframes typingAnimation {
                    0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
                    40% { opacity: 1; transform: scale(1.2); }
                }
            `}</style>

            <div style={{ background: '#1a73e8', color: 'white', padding: '15px', textAlign: 'center', fontWeight: 'bold', position: 'relative' }}>
                ELECTROMART AI
                <span onClick={() => setIsOpen(false)} style={{ position: 'absolute', right: '15px', cursor: 'pointer', fontSize: '20px' }}>×</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '15px', background: '#f8f9fa', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.map((m, i) => (
                    <div key={i} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '10px 15px', borderRadius: '15px', background: m.sender === 'user' ? '#1a73e8' : 'white', color: m.sender === 'user' ? 'white' : 'black', fontSize: '14px', border: m.sender === 'bot' ? '1px solid #eee' : 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        {renderMessageContent(m.text, m.sender)}
                    </div>
                ))}
                {isTyping && (
                    <div style={{ alignSelf: 'flex-start', background: 'white', padding: '12px 16px', borderRadius: '15px 15px 15px 0', border: '1px solid #eee', display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {[0, 1, 2].map((dot) => (
                            <span key={dot} style={{ width: '6px', height: '6px', background: '#888', borderRadius: '50%', display: 'inline-block', animation: 'typingAnimation 1.4s infinite ease-in-out', animationDelay: `${dot * 0.2}s` }}></span>
                        ))}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: '10px', borderTop: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '10px', background: 'white' }}>
                <input style={{ flex: 1, background: '#f1f3f4', border: 'none', borderRadius: '20px', padding: '10px 15px', outline: 'none' }} placeholder="Ask AI..." value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} />
                <button onClick={handleSend} style={{ background: 'transparent', border: 'none', color: '#1a73e8', fontWeight: 'bold', cursor: 'pointer' }}>Send</button>
            </div>
        </div>
    );
};

export default ChatBox;