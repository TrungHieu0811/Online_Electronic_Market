import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8080';
const DEFAULT_AVATAR =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAsJtKzVastl37y1I4sAhhnMQ4bSZhhWlH1YsrhH5ZdkiSML8EV5NVrM-T5t0LOT6DKEMgVt_fk24-70yAZvLRPxOVJHygogu5xfrft9t7OJMmlE54D1niW7Gf61puoL5vCRrZQeh_wSfhjU6jOHarzc4rNpdIyUHh1hiQifF9hC-4FWPZ8Y0A8f6WudZO8px0_bvdYmH2zhZc-dmZop-83kKY0TY0i1sYNSDzkxcWBGmy9K2hc57VjHTrcirYx4ZXrhBNjqGwBuylv';

export default function ProfileCard({ user }) {
    const navigate = useNavigate();
    const location = useLocation();

    const handleOpenEdit = () => {
        navigate('/profile/edit', {
            state: {
                backgroundLocation: location,
                user
            }
        });
    };

    const avatarSrc = user?.avatarUrl
        ? user.avatarUrl.startsWith('http')
            ? user.avatarUrl
            : `${API_BASE_URL}/uploads${user.avatarUrl}`
        : DEFAULT_AVATAR;

    return (
        <section className='group relative col-span-12 flex items-center gap-8 overflow-hidden rounded-xl bg-surface-container-lowest p-8 lg:col-span-8'>
            <div className='absolute bottom-0 left-0 top-0 w-1 bg-primary'></div>

            <img
                src={avatarSrc}
                alt='User avatar'
                className='h-32 w-32 rounded-xl object-cover shadow-lg'
                onError={(e) => {
                    e.currentTarget.src = DEFAULT_AVATAR;
                }}
            />

            <div className='flex-1'>
                <div className='mb-2 flex items-center gap-4'>
                    <h2 className='font-headline text-3xl font-bold text-on-surface'>
                        {user?.fullName || 'No name'}
                    </h2>
                </div>

                <p className='mb-3 flex items-center gap-2 text-on-surface-variant'>
                    <span className='material-symbols-outlined text-sm'>mail</span>
                    {user?.email || 'No email'}
                </p>

                <p className='mb-6 flex items-center gap-2 text-on-surface-variant'>
                    <span className='material-symbols-outlined text-sm'>call</span>
                    {user?.phone || 'No phone'}
                </p>

                <div className='flex gap-4'>
                    <button
                        onClick={handleOpenEdit}
                        className='rounded-lg bg-gradient-to-br from-primary to-primary-container px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90'
                    >
                        Edit Profile
                    </button>

                    <button className='rounded-lg bg-surface-container-high px-6 py-2.5 text-sm font-semibold text-on-primary-fixed-variant transition-colors hover:bg-surface-variant'>
                        Download Data
                    </button>
                </div>
            </div>

            <div className='pointer-events-none absolute -bottom-4 -right-4 hidden opacity-5 xl:block'>
                <span
                    className='material-symbols-outlined text-[120px]'
                    style={{ fontVariationSettings: "'FILL' 1" }}
                >
                    analytics
                </span>
            </div>
        </section>
    );
}
