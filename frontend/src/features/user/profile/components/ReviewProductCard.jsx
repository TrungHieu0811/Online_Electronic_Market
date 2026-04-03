import StarRatingInput from './StarRatingInput';

export default function ReviewProductCard({ item, review, onRatingChange, onCommentChange }) {
    return (
        <section className='mb-8 rounded-2xl bg-white p-8 shadow-[0px_12px_32px_rgba(0,26,64,0.08)]'>
            <div className='flex flex-col gap-8 md:flex-row'>
                <div className='h-48 w-full flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 md:w-48'>
                    {item.image ? (
                        <img
                            src={item.image}
                            alt={item.name}
                            className='h-full w-full object-cover'
                        />
                    ) : (
                        <div className='flex h-full w-full items-center justify-center text-slate-400'>
                            No Image
                        </div>
                    )}
                </div>

                <div className='flex-grow'>
                    <div className='mb-6'>
                        <h2 className='text-2xl font-bold text-slate-900'>{item.name}</h2>
                        <p className='font-medium text-slate-600'>{item.variant}</p>
                    </div>

                    <div className='mb-8'>
                        <p className='mb-4 text-sm font-bold uppercase tracking-tight text-slate-600'>
                            Overall Rating
                        </p>
                        <StarRatingInput
                            value={review?.rating || 0}
                            onChange={(value) => onRatingChange(item.id, value)}
                        />
                    </div>

                    <div className='mb-2'>
                        <label className='mb-3 block text-sm font-bold uppercase tracking-tight text-slate-600'>
                            Review Details
                        </label>
                        <textarea
                            value={review?.comment || ''}
                            onChange={(e) => onCommentChange(item.id, e.target.value)}
                            placeholder='Share your experience with this product...'
                            className='min-h-[120px] w-full rounded-xl bg-slate-100 p-4 outline-none ring-0 transition placeholder:text-slate-400 focus:ring-2 focus:ring-[#003f87]/30'
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
