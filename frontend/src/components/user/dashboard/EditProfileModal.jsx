import { getMyProfile, updateMyProfile, uploadAvatar } from '@/services/profileApi';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // 👉 IMPORT TOAST

const DEFAULT_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsJtKzVastl37y1I4sAhhnMQ4bSZhhWlH1YsrhH5ZdkiSML8EV5NVrM-T5t0LOT6DKEMgVt_fk24-70yAZvLRPxOVJHygogu5xfrft9t7OJMmlE54D1niW7Gf61puoL5vCRrZQeh_wSfhjU6jOHarzc4rNpdIyUHh1hiQifF9hC-4FWPZ8Y0A8f6WudZO8px0_bvdYmH2zhZc-dmZop-83kKY0TY0i1sYNSDzkxcWBGmy9K2hc57VjHTrcirYx4ZXrhBNjqGwBuylv';
const API_BASE_URL = 'http://localhost:8080';

export default function EditProfileModal() {
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef(null);

    const routeUser = location.state?.user;

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        address: '',
        gender: '',
        dob: '',
        avatarUrl: '',
        email: '',
        displayName: ''
    });

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (routeUser) {
            hydrateForm(routeUser);
        } else {
            fetchProfileFallback();
        }
    }, [routeUser]);

    const hydrateForm = (data) => {
        setFormData({
            fullName: data.fullName ?? '',
            phone: data.phone ?? '',
            address: data.address ?? '',
            gender: data.gender != null ? String(data.gender) : '',
            dob: data.dob ? String(data.dob).slice(0, 10) : '',
            avatarUrl: data.avatarUrl ?? '',
            email: data.email ?? '',
            displayName: data.username ?? data.displayName ?? ''
        });
    };

    const fetchProfileFallback = async () => {
        try {
            const data = await getMyProfile();
            hydrateForm(data);
        } catch (error) {
            console.error('Failed to load profile:', error);
            toast.error('Failed to load profile data.'); // 👉 ĐỔI THÀNH TOAST
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleClose = () => {
        navigate(-1);
    };

    const handleChoosePhoto = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const result = await uploadAvatar(file);

            setFormData((prev) => ({
                ...prev,
                avatarUrl: result.avatarUrl
            }));

            toast.success(result.message || 'Avatar uploaded successfully!'); // 👉 ĐỔI THÀNH TOAST
        } catch (error) {
            console.error('Avatar upload failed:', error);
            toast.error(error?.response?.data || 'Avatar upload failed!'); // 👉 ĐỔI THÀNH TOAST
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            const payload = {
                fullName: formData.fullName?.trim() || null,
                phone: formData.phone?.trim() || null,
                address: formData.address?.trim() || null,
                gender: formData.gender === '' ? null : Number(formData.gender),
                dob: formData.dob || null,
                avatarUrl: formData.avatarUrl?.trim() || null
            };

            const cleanedPayload = Object.fromEntries(
                Object.entries(payload).filter(([_, value]) => value !== null && value !== '')
            );

            await updateMyProfile(cleanedPayload);
            
            // 👉 1. HIỆN TOAST THÀNH CÔNG ĐẸP MẮT
            toast.success('Profile updated successfully!');
            
            // 👉 2. TRUYỀN TÍN HIỆU (refresh: Date.now()) VỀ TRANG CHA KHI ĐÓNG MODAL
            // Dùng Date.now() để đảm bảo mỗi lần update xong tín hiệu đều khác nhau -> Ép React render lại
            navigate('/profile', { replace: true, state: { refresh: Date.now() } });
            
        } catch (error) {
            console.error('Update failed:', error);
            toast.error(error?.response?.data || 'Profile update failed!'); // 👉 ĐỔI THÀNH TOAST
        } finally {
            setLoading(false);
        }
    };

    const previewAvatar = formData.avatarUrl
        ? formData.avatarUrl.startsWith('http')
            ? formData.avatarUrl
            : `${API_BASE_URL}/uploads${formData.avatarUrl}`
        : DEFAULT_AVATAR;

    return (
        <div
            className='fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm'
            onClick={handleClose}
        >
            <div
                className='w-full max-w-[720px] rounded-[28px] bg-white/80 shadow-[0_32px_64px_rgba(0,0,0,0.16)] backdrop-blur-xl'
                onClick={(e) => e.stopPropagation()}
            >
                <div className='max-h-[88vh] overflow-y-auto p-8'>
                    {/* ... (Toàn bộ phần HTML giao diện của bạn giữ nguyên không đổi) ... */}
                    <div className='mb-8 flex items-start justify-between'>
                        <div>
                            <h2 className='font-headline text-[2rem] font-bold tracking-tight text-on-surface'>
                                Edit Profile
                            </h2>
                            <p className='mt-1 text-sm text-on-surface-variant'>
                                Update your account identity and contact details.
                            </p>
                        </div>
                        <button
                            type='button'
                            onClick={handleClose}
                            className='flex h-10 w-10 items-center justify-center rounded-full text-on-surface transition hover:bg-black/5'
                        >
                            <span className='material-symbols-outlined'>close</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className='mb-8 flex items-center gap-6 rounded-[22px] border border-outline-variant/20 bg-white/55 p-5'>
                            <div className='h-20 w-20 overflow-hidden rounded-full border-2 border-primary/15 bg-surface-container-high'>
                                <img
                                    src={previewAvatar}
                                    alt='Avatar'
                                    className='h-full w-full object-cover'
                                    onError={(e) => {
                                        e.currentTarget.src = DEFAULT_AVATAR;
                                    }}
                                />
                            </div>

                            <div className='flex flex-wrap gap-3'>
                                <button
                                    type='button'
                                    onClick={handleChoosePhoto}
                                    disabled={uploading}
                                    className='rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60'
                                >
                                    {uploading ? 'Uploading...' : 'Change Photo'}
                                </button>
                            </div>

                            <input
                                ref={fileInputRef}
                                type='file'
                                accept='image/*'
                                className='hidden'
                                onChange={handleFileChange}
                            />
                        </div>

                        <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                            <Field label='Full Name'>
                                <input
                                    type='text'
                                    name='fullName'
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </Field>

                            <Field label='Display Name'>
                                <input
                                    type='text'
                                    name='displayName'
                                    value={formData.displayName}
                                    readOnly
                                    className={readOnlyInputClass}
                                />
                            </Field>

                            <Field label='Email Address'>
                                <input
                                    type='email'
                                    name='email'
                                    value={formData.email}
                                    readOnly
                                    className={readOnlyInputClass}
                                />
                            </Field>

                            <Field label='Phone Number'>
                                <input
                                    type='text'
                                    name='phone'
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </Field>

                            <div className='md:col-span-2'>
                                <Field label='Address'>
                                    <textarea
                                        name='address'
                                        rows='3'
                                        value={formData.address}
                                        onChange={handleChange}
                                        className={textareaClass}
                                    />
                                </Field>
                            </div>

                            <Field label='Gender'>
                                <select
                                    name='gender'
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className={inputClass}
                                >
                                    <option value=''>Select gender</option>
                                    <option value='1'>Male</option>
                                    <option value='0'>Female</option>
                                    <option value='2'>Other</option>
                                </select>
                            </Field>

                            <Field label='Date of Birth'>
                                <input
                                    type='date'
                                    name='dob'
                                    value={formData.dob}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </Field>
                        </div>

                        <div className='mt-10 flex items-center justify-end gap-4 border-t border-outline-variant/15 pt-8'>
                            <button
                                type='button'
                                onClick={handleClose}
                                className='px-3 py-3 text-base font-bold text-on-surface-variant transition hover:text-on-surface'
                            >
                                Discard Changes
                            </button>

                            <button
                                type='submit'
                                disabled={loading}
                                className='rounded-[18px] bg-gradient-to-br from-primary to-primary-container px-8 py-3 text-base font-bold text-white shadow-[0_10px_24px_rgba(17,92,185,0.24)] transition hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

const inputClass = 'w-full rounded-[18px] border border-outline-variant/40 bg-surface-container-highest/70 px-4 py-3.5 text-on-surface outline-none shadow-sm transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/30 focus:shadow-md';
const textareaClass = 'w-full resize-none rounded-[18px] border border-outline-variant/40 bg-surface-container-highest/70 px-4 py-3.5 text-on-surface outline-none shadow-sm transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/30 focus:shadow-md';
const readOnlyInputClass = 'w-full rounded-[18px] border border-outline-variant/20 bg-surface-container-highest/40 px-4 py-3.5 text-on-surface/70 outline-none';
const readOnlyTextareaClass = 'w-full resize-none rounded-[18px] border border-outline-variant/20 bg-surface-container-highest/40 px-4 py-3.5 text-on-surface/70 outline-none';

function Field({ label, children }) {
    return (
        <label className='flex flex-col gap-2'>
            <span className='px-1 text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant'>
                {label}
            </span>
            {children}
        </label>
    );
}