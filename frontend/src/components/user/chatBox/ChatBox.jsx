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

        const productRegex = /\[ID:([\w-]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g;
        const orderRegex = /\[ORDER:([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g;

        const elements = [];
        let lastIndex = 0;

        // Hàm xử lý văn bản xen kẽ
        const pushText = (endIndex) => {
            if (endIndex > lastIndex) {
                elements.push(
                    <div className="markdown-body" key={`text-${lastIndex}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {text.substring(lastIndex, endIndex)}
                        </ReactMarkdown>
                    </div>
                );
            }
        };

        // Tìm tất cả các thẻ (cả Product và Order)
        const allMatches = [];
        let match;
        while ((match = productRegex.exec(text)) !== null) allMatches.push({ type: 'product', data: match });
        productRegex.lastIndex = 0; // Reset index
        while ((match = orderRegex.exec(text)) !== null) allMatches.push({ type: 'order', data: match });

        // Sắp xếp các thẻ theo thứ tự xuất hiện trong văn bản
        allMatches.sort((a, b) => a.data.index - b.data.index);

        allMatches.forEach((m, idx) => {
            pushText(m.data.index);

            if (m.type === 'product') {
                const [full, slug, imageUrl, name, price] = m.data;
                elements.push(
                    <div key={`prod-${idx}`} style={cardStyle}>
                        <img src={imageUrl === "no image" ? "https://via.placeholder.com/150" : imageUrl} alt={name} style={imgStyle} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{name}</div>
                            <div style={{ color: '#d32f2f', fontWeight: 'bold' }}>{price}</div>
                            <button onClick={() => window.location.href = `/products/${slug}`} style={btnStyle}>View Details</button>
                        </div>
                    </div>
                );
            } else {
                // Render Order Card
                const [full, id, status, date, total, items] = m.data;
                elements.push(
                    <div key={`order-${idx}`} style={{ border: '1px solid #e0e0e0', borderRadius: '10px', padding: '12px', margin: '10px 0', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 'bold', color: '#1a73e8' }}>Order {id}</span>
                            <span style={{ fontSize: '11px', color: '#666' }}>{date}</span>
                        </div>
                        <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                            <strong>Status:</strong> <span style={{ color: status.includes('DELIVERED') ? 'green' : status.includes('CANCEL') ? 'red' : '#f39c12' }}>{status}</span>
                        </div>
                        <div style={{ fontSize: '13px', marginBottom: '4px' }}><strong>Items:</strong> {items}</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'right', color: '#333', borderTop: '1px dashed #eee', paddingTop: '5px' }}>
                            Total: <span style={{ color: '#d32f2f' }}>{total}</span>
                        </div>
                    </div>
                );
            }
            lastIndex = m.data.index + m.data[0].length;
        });

        pushText(text.length);
        return elements;
    };

    // Các style phụ trợ
    const cardStyle = { border: '1px solid #eee', borderRadius: '10px', padding: '12px', margin: '8px 0', background: 'white', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
    const imgStyle = { width: '65px', height: '65px', objectFit: 'contain' };
    const btnStyle = { background: '#1a73e8', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '12px', cursor: 'pointer', fontSize: '11px' };

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
    .markdown-body {
        overflow-x: auto;
        width: 100%;
        background-color: transparent !important;
        margin: 0;
        padding: 0;
    }
    table {
        border-collapse: collapse;
        width: 100%;
        min-width: 320px; /* Tăng nhẹ min-width để bảng có không gian */
        margin: 8px 0;
        background-color: white;
        border: 1px solid #dee2e6;
    }
    table th, table td {
        border: 1px solid #dee2e6;
        padding: 8px 6px;
        text-align: left;
        font-size: 11px;
        word-break: break-word;
    }
    /* CSS CẢI TIẾN: Ép cột Price không được xuống dòng */
    table th:last-child, 
    table td:last-child {
        white-space: nowrap; /* Không cho phép ngắt dòng */
        width: 1%;           /* Ép cột co lại vừa khít nội dung */
        min-width: 60px;     /* Đảm bảo đủ chỗ cho con số và ký hiệu $ */
        text-align: right;   /* Căn lề phải cho giá tiền nhìn sẽ chuyên nghiệp hơn */
    }
    table th {
        background-color: #f8f9fa;
        font-weight: bold;
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