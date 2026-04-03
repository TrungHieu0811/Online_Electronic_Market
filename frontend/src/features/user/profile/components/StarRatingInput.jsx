import { Star } from 'lucide-react';

export default function StarRatingInput({ value, onChange }) {
    return (
        <div className='flex gap-2'>
            {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= value;

                return (
                    <button
                        key={star}
                        type='button'
                        onClick={() => onChange(star)}
                        className='transition hover:scale-110'
                    >
                        <Star
                            className={`h-8 w-8 ${
                                active ? 'fill-orange-300 text-orange-300' : 'text-slate-300'
                            }`}
                        />
                    </button>
                );
            })}
        </div>
    );
}
