import React from 'react';

const OrderTimeline = ({ history }) => {
    // Nếu chưa có dữ liệu lịch sử
    if (!history || history.length === 0) {
        return (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center text-slate-400 italic">
                No processing history recorded yet.
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider mb-8">
                Order Processing Timeline
            </h3>
            
            <div className="relative">
                {/* Đường kẻ dọc nối các điểm timeline */}
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100"></div>

                <div className="space-y-10">
                    {history.map((log, index) => (
                        <div key={log.id} className="relative pl-10 group">
                            {/* Điểm tròn biểu thị mốc thời gian */}
                            <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white z-10 transition-transform group-hover:scale-125 ${
                                index === 0 ? 'bg-orange-500 shadow-lg shadow-orange-200' : 'bg-slate-300'
                            }`} />
                            
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-slate-900">
                                        {log.admin?.fullname || 'System'} 
                                    </span>
                                    <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase">
                                        {log.newStatus}
                                    </span>
                                </div>

                                <span className="text-xs font-medium text-slate-400">
                                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                                </span>

                                {/* Hiển thị lý do thay đổi nếu có */}
                                {log.reason && (
                                    <div className="mt-3 p-4 bg-slate-50 rounded-2xl border-l-4 border-orange-400 text-sm text-slate-600 italic leading-relaxed">
                                        "{log.reason}"
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OrderTimeline;