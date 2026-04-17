import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage } from '@/services/chatService';

const ChatBox = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ role: 'bot', text: 'Xin chào! ElectroMart có thể giúp gì cho bạn?' }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef();

    useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
        // Service này giờ đây hỗ trợ cả Guest và User
        const data = await sendChatMessage(currentInput);
        setMessages(prev => [...prev, { role: 'bot', text: data }]);
    } catch (err) {
        setMessages(prev => [...prev, { role: 'bot', text: 'Hệ thống bận, vui lòng thử lại sau.' }]);
    } finally {
        setLoading(false);
    }
};
    return (
        <div className="fixed bottom-6 right-6 z-[999]">
            <button onClick={() => setIsOpen(!isOpen)} className="bg-blue-600 text-white p-4 rounded-full shadow-2xl">
                {isOpen ? 'Đóng' : 'AI Chat'}
            </button>

            {isOpen && (
                <div className="absolute bottom-20 right-0 w-80 h-[450px] bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden">
                    <div className="bg-blue-600 p-4 text-white font-bold">Hỗ Trợ ElectroMart</div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-3 rounded-xl text-sm max-w-[85%] ${
                                    m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border'
                                }`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {loading && <div className="text-[10px] animate-pulse">AI ĐANG TRẢ LỜI...</div>}
                        <div ref={scrollRef} />
                    </div>
                    <div className="p-3 border-t flex gap-2">
                        <input className="flex-1 bg-slate-100 rounded-lg px-3 py-2 text-sm outline-none"
                            value={input} onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
                        <button onClick={handleSend} className="text-blue-600 font-bold">Gửi</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatBox;