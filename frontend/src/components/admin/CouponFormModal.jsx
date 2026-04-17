import React, { useState, useEffect } from 'react';
import { couponService } from '@/services/couponService';
import { X, AlertCircle, Tag, CheckCircle2 } from 'lucide-react';
import Swal from 'sweetalert2';

const INITIAL_STATE = {
    code: '',
    description: '',
    discountType: 'FIXED_AMOUNT',
    discountValue: 0,
    maxDiscountAmount: 0,
    minOrderValue: 0,
    usageLimit: '',
    perUserLimit: 1,
    startDate: '',
    endDate: '',
};

export default function CouponFormModal({ isOpen, onClose, onSuccess, editData }) {
    const [formData, setFormData] = useState(INITIAL_STATE);
    const [errors, setErrors] = useState({});

    // Kiểm tra trạng thái hiện tại
    const isEdit = !!editData;
    const isScheduled = isEdit && formData.status === 'SCHEDULED';
    const isActive = isEdit && formData.status === 'ACTIVE';
    const isDisabled = isEdit && formData.status === 'DISABLED';
    const isExpired = isEdit && formData.status === 'EXPIRED';

    useEffect(() => {
        if (isOpen) {
            setFormData(editData ? { ...editData } : INITIAL_STATE);
            setErrors({});
        }
    }, [isOpen, editData]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked :
                (type === 'number' ? (value === '' ? '' : parseFloat(value)) : value)
        }));
    };

    // Hàm xác nhận thay đổi trạng thái cho mã đang chạy hoặc đã tắt
    const confirmStatusChange = (newStatus, title, text, icon) => {
        Swal.fire({
            title: title,
            text: text,
            icon: icon,
            showCancelButton: true,
            confirmButtonColor: '#0ea5e9',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, proceed',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                setFormData(prev => ({ ...prev, status: newStatus }));
            }
        });
    };

    const validateForm = () => {
        const newErrors = {};
        const now = new Date();
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);

        if (!formData.code.trim()) newErrors.code = "Coupon code is required";

        if (!isActive && !isExpired) { // Nếu đã Active hoặc Expired thì không cần validate ngày bắt đầu nữa
            if (!formData.startDate) {
                newErrors.startDate = "Start date is required";
            } else if (!isEdit && start < now.setSeconds(0, 0)) {

                newErrors.startDate = "Start date must be current or future";
            }
        }

        if (!formData.endDate) newErrors.endDate = "End date is required";
        else if (end <= start) newErrors.endDate = "End date must be after start date";

        if (formData.discountValue <= 0) newErrors.discountValue = "Value must be > 0";
        if (formData.discountType === 'PERCENTAGE' && formData.discountValue > 100) {
            newErrors.discountValue = "Percentage cannot exceed 100%";
        }
        if (formData.discountType === 'FIXED_AMOUNT' && formData.minOrderValue <= formData.discountValue) {
            newErrors.minOrderValue = "Min order must be greater than discount";
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Chặn nếu đang Active mà không phải hành động Disable
        if (isActive && formData.status !== 'DISABLED' && isEdit) {
            Swal.fire({ icon: 'info', title: 'Locked', text: 'Active coupons can only be disabled.' });
            return;
        }

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            const adminId = 1; // Nên lấy từ Context/Auth
            if (isEdit) {
                await couponService.updateCoupon(formData.id, formData, adminId);
            } else {
                await couponService.createCoupon(formData);
            }

            Swal.fire({ icon: 'success', title: isEdit ? 'Updated!' : 'Created!', timer: 1500, showConfirmButton: false });
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            const msg = error.response?.data || "Operation failed";
            setErrors({ server: msg });
            Swal.fire({ icon: 'error', title: 'Error', text: msg });
        }
    };

    // Logic khóa các trường (Fields Locking Logic)
    const isLocked = (fieldName) => {
        if (!isEdit) return false;
        if (isActive || isDisabled || isExpired) return true; // Thêm isExpired vào đây
        if (isScheduled) {
            const allowed = ['startDate', 'endDate', 'usageLimit', 'perUserLimit', 'description'];
            return !allowed.includes(fieldName);
        }
        return true;
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{isEdit ? 'Update Coupon' : 'Create New Coupon'}</h2>
                        <p className="text-xs text-slate-500 mt-1">Status: <span className={`font-bold ${isActive ? 'text-emerald-500' : 'text-sky-600'}`}>{isEdit ? formData.status : 'NEW'}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 overflow-y-auto">

                    {(isActive || isScheduled) && formData.status !== 'DISABLED' && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-3">
                                <AlertCircle size={20} className="text-amber-600" />
                                <div>
                                    <p className="font-bold">{isActive ? 'Coupon is Active' : 'Coupon is Scheduled'}</p>
                                    <p className="opacity-80">Would you like to disable this coupon?</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => confirmStatusChange('DISABLED', 'Disable Coupon?', 'This code will be deactivated.', 'warning')}
                                className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-700 transition-all"
                            >
                                DISABLE NOW
                            </button>
                        </div>
                    )}
                    {isExpired && (
                        <div className="mb-6 p-4 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-sm flex items-center gap-3">
                            <AlertCircle size={20} />
                            <div>
                                <p className="font-bold">This coupon has EXPIRED</p>

                            </div>
                        </div>
                    )}

                    {/* Thông báo Re-enable cho DISABLED (Nếu còn hạn) */}
                    {isDisabled && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-sm flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Tag size={20} className="text-blue-600" />
                                <div>
                                    <p className="font-bold">Coupon is Disabled</p>
                                    <p className="text-blue-700/80">Would you like to re-enable this coupon?</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => confirmStatusChange('SCHEDULED', 'Re-enable Coupon?', 'The system will recalculate status based on dates.', 'info')}
                                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700"
                            >
                                RE-ENABLE
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Coupon Code</label>
                            <input
                                name="code" type="text" disabled={isEdit}
                                className={`w-full border rounded-xl p-3 text-sm outline-none font-mono ${isEdit ? 'bg-slate-100 text-slate-500' : 'bg-slate-50 focus:ring-2 focus:ring-sky-500'}`}
                                value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            />
                            {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                            <textarea
                                name="description" rows="2" disabled={isActive || isDisabled}
                                className={`w-full border rounded-xl p-3 text-sm outline-none ${(isActive || isDisabled) ? 'bg-slate-100' : 'bg-slate-50 focus:ring-2 focus:ring-sky-500'}`}
                                value={formData.description} onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Discount Type</label>
                            <select
                                name="discountType" disabled={isLocked('discountType')}
                                className={`w-full border rounded-xl p-3 text-sm outline-none ${isLocked('discountType') ? 'bg-slate-100' : 'bg-slate-50 focus:ring-2 focus:ring-sky-500'}`}
                                value={formData.discountType} onChange={handleChange}
                            >
                                <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
                                <option value="PERCENTAGE">Percentage (%)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Discount Value</label>
                            <input
                                name="discountValue" type="number" step="1" disabled={isLocked('discountValue')}
                                className={`w-full border rounded-xl p-3 text-sm outline-none ${errors.discountValue ? 'border-red-500' : 'border-slate-200'} ${isLocked('discountValue') ? 'bg-slate-100' : 'bg-slate-50 focus:ring-2 focus:ring-sky-500'}`}
                                value={formData.discountValue === 0 ? '' : formData.discountValue} onChange={handleChange} onFocus={(e) => e.target.select()}
                            />
                            {errors.discountValue && <p className="text-red-500 text-xs mt-1 font-medium">{errors.discountValue}</p>}
                        </div>

                        {formData.discountType === 'PERCENTAGE' && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Max Discount Amount</label>
                                <input
                                    name="maxDiscountAmount" type="number" step="1" disabled={isLocked('maxDiscountAmount')}
                                    className={`w-full border rounded-xl p-3 text-sm outline-none ${isLocked('maxDiscountAmount') ? 'bg-slate-100' : 'bg-slate-50 focus:ring-2 focus:ring-sky-500'}`}
                                    value={formData.maxDiscountAmount === 0 ? '' : formData.maxDiscountAmount} onChange={handleChange} onFocus={(e) => e.target.select()}
                                />
                            </div>
                        )}

                        <div className={formData.discountType !== 'PERCENTAGE' ? "md:col-span-1" : ""}>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Min Order Value</label>
                            <input
                                name="minOrderValue" type="number" step="1" disabled={isLocked('minOrderValue')}
                                className={`w-full border rounded-xl p-3 text-sm outline-none ${errors.minOrderValue ? 'border-red-500' : 'border-slate-200'} ${isLocked('minOrderValue') ? 'bg-slate-100' : 'bg-slate-50 focus:ring-2 focus:ring-sky-500'}`}
                                value={formData.minOrderValue === 0 ? '' : formData.minOrderValue} onChange={handleChange} onFocus={(e) => e.target.select()}
                            />
                            {errors.minOrderValue && <p className="text-red-500 text-xs mt-1 font-medium">{errors.minOrderValue}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Total Usage Limit</label>
                            <input
                                name="usageLimit" type="number" disabled={isActive || isDisabled}
                                className={`w-full border rounded-xl p-3 text-sm outline-none ${(isActive || isDisabled) ? 'bg-slate-100' : 'bg-slate-50 focus:ring-2 focus:ring-sky-500'}`}
                                value={formData.usageLimit} onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Limit Per Customer</label>
                            <input
                                name="perUserLimit" type="number" disabled={isActive || isDisabled}
                                className={`w-full border rounded-xl p-3 text-sm outline-none ${(isActive || isDisabled) ? 'bg-slate-100' : 'bg-slate-50 focus:ring-2 focus:ring-sky-500'}`}
                                value={formData.perUserLimit} onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date</label>
                            <input
                                name="startDate" type="datetime-local" disabled={isActive || isDisabled}
                                className={`w-full border rounded-xl p-3 text-sm outline-none ${errors.startDate ? 'border-red-500' : 'border-slate-200'} ${(isActive || isDisabled) ? 'bg-slate-100' : 'bg-slate-50 focus:ring-2 focus:ring-sky-500'}`}
                                value={formData.startDate} onChange={handleChange}
                            />
                            {errors.startDate && <p className="text-red-500 text-xs mt-1 font-medium">{errors.startDate}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">End Date</label>
                            <input
                                name="endDate" type="datetime-local" disabled={isActive || isDisabled}
                                className={`w-full border rounded-xl p-3 text-sm outline-none ${errors.endDate ? 'border-red-500' : 'border-slate-200'} ${(isActive || isDisabled) ? 'bg-slate-100' : 'bg-slate-50 focus:ring-2 focus:ring-sky-500'}`}
                                value={formData.endDate} onChange={handleChange}
                            />
                            {errors.endDate && <p className="text-red-500 text-xs mt-1 font-medium">{errors.endDate}</p>}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all">
                            {isExpired ? 'Close' : 'Cancel'}
                        </button>

                        {!isExpired && ( // Chỉ hiện nút bấm nếu không phải Expired
                            <button
                                type="submit"
                                disabled={isActive && formData.status === 'ACTIVE'}
                                className={`px-8 py-2.5 rounded-xl font-bold shadow-lg transition-all ${(isActive && formData.status === 'ACTIVE') ? 'bg-slate-300 cursor-not-allowed text-slate-500' : 'bg-sky-500 text-white hover:bg-sky-600'}`}
                            >
                                {isEdit ? 'Update Coupon' : 'Save Coupon'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}