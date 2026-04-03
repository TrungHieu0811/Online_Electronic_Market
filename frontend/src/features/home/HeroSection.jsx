export default function HeroSection() {
    return (
        <section className='relative overflow-hidden bg-gray-100'>
            <div className='mx-auto flex max-w-7xl flex-col items-center px-4 py-12 md:flex-row md:py-20'>
                {/* Left content */}
                <div className='z-10 mb-10 text-center md:mb-0 md:w-1/2 md:text-left'>
                    <span className='mb-4 inline-block rounded-full bg-yellow-400 px-3 py-1 text-sm font-bold uppercase tracking-widest text-[#045fae]'>
                        New Arrival
                    </span>

                    <h1 className='mb-6 text-4xl font-black leading-tight text-[#045fae] md:text-6xl'>
                        The New Era of <br />
                        <span className='text-gray-900'>Performance</span>
                    </h1>

                    <p className='mb-8 max-w-lg text-lg text-gray-600'>
                        Experience the latest smartphone technology with the Galaxy S24 Ultra.
                        Professional-grade camera, titanium build, and AI-powered performance.
                    </p>

                    <div className='flex flex-col justify-center gap-4 sm:flex-row md:justify-start'>
                        <button className='rounded bg-[#045fae] px-10 py-4 font-bold text-white shadow-lg transition hover:bg-blue-800'>
                            Shop Now
                        </button>

                        <button className='rounded border-2 border-[#045fae] px-10 py-4 font-bold text-[#045fae] transition hover:bg-[#045fae] hover:text-white'>
                            Learn More
                        </button>
                    </div>
                </div>

                {/* Right image */}
                <div className='relative flex justify-center md:w-1/2'>
                    <img
                        src='https://lh3.googleusercontent.com/aida-public/AB6AXuCJMKnCoh5HXJuFkvlKMQkD5qBEy_aEOqMDWUv95cVXLYN-GL5iDy4E9MQFiSGhaeFpM7HOjt8PilbxziZ2xUh-MUlBvpShwu1b_C4-9PaqZ8epjA_WDgAVvFwq01gy5KwGPOqIh28wSB6-nTd7alya7svssTlVvPkQcxWb74kZwvlz95wrjq9y-D7yYX6w-KzXIQ0Ie73C8lYVFoWQ30AeaVPYm5ch1xlr4fPBNxpYW18Y4pnVDU_JV84xpi0r9kQt1qOlLPCKqFZf'
                        alt='Latest Smartphone Promotion'
                        className='w-full max-w-lg object-contain drop-shadow-2xl'
                    />
                </div>
            </div>

            {/* Decorative shape */}
            <div className='absolute right-0 top-0 h-full w-1/3 -translate-x-0 translate-y-0 -skew-x-12 bg-[#045fae] opacity-5' />
        </section>
    );
}
