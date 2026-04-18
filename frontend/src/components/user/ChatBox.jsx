import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage } from '@/services/chatService';

const ChatBox = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ role: 'bot', text: 'Chào bạn! Mình có thể giúp gì cho bạn?' }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef();

    useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        setMessages(prev => [...prev, { role: 'user', text: input }]);
        const currentInput = input;
        setInput('');
        setLoading(true);

        try {
            const data = await sendChatMessage(currentInput);
            setMessages(prev => [...prev, { role: 'bot', text: data }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'bot', text: 'Hệ thống bận, vui lòng thử lại.' }]);
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed bottom-5 right-5 z-50">
            <button onClick={() => setIsOpen(!isOpen)} className="bg-blue-600 text-white p-4 rounded-full shadow-lg font-bold">
                {isOpen ? 'Đóng' : 'AI Support'}
            </button>
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-80 h-[450px] bg-white border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    <div className="bg-blue-600 p-4 text-white font-bold text-center">ELECTROMART AI</div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-3 rounded-xl text-sm max-w-[85%] ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
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
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Hỏi AI..." />
                        <button onClick={handleSend} className="text-blue-600 font-bold">Gửi</button>
                    </div>
                </div>
            )}
        </div>
    );
};
export default ChatBox;