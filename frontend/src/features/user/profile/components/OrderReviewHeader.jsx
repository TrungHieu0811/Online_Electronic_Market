export default function OrderReviewHeader({ orderId, status }) {
    return (
        <header className='mb-12'>
            <div className='mb-6 flex w-fit items-center gap-3 rounded-full bg-slate-100 px-4 py-2'>
                <span className='text-xs font-bold uppercase tracking-widest text-slate-600'>
                    Order ID: #{orderId}
                </span>
                <span className='h-1.5 w-1.5 rounded-full bg-[#003f87]' />
                <span className='text-xs font-bold uppercase tracking-widest text-[#003f87]'>
                    Status: {status}
                </span>
            </div>

            <h1 className='mb-3 text-5xl font-black tracking-tight text-slate-900'>
                Rate Your Order
            </h1>

            <p className='max-w-xl text-lg leading-relaxed text-slate-600'>
                Please rate each purchased item below. Your feedback helps us improve and guides
                others in the community.
            </p>
        </header>
    );
}
