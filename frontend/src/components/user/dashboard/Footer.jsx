import React from 'react';

export default function Footer() {
    return (
        <footer className='mt-16 flex flex-col items-center justify-between gap-4 border-t border-outline-variant/10 pt-8 md:flex-row'>
            <p className='text-xs font-medium text-on-surface-variant'>
                © 2024 ElectroMart Precision Ledger. All rights reserved.
            </p>

            <div className='flex gap-8'>
                <a
                    href='#'
                    className='text-xs text-on-surface-variant transition-colors hover:text-primary'
                >
                    Privacy Policy
                </a>
                <a
                    href='#'
                    className='text-xs text-on-surface-variant transition-colors hover:text-primary'
                >
                    Terms of Service
                </a>
                <a
                    href='#'
                    className='text-xs text-on-surface-variant transition-colors hover:text-primary'
                >
                    Data Preference
                </a>
            </div>
        </footer>
    );
}
