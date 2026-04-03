import { Camera } from 'lucide-react';

export default function PhotoUploadBox({ files = [], onChange }) {
    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        onChange(selectedFiles);
    };

    return (
        <div className='flex flex-col gap-4'>
            <label className='inline-flex w-fit cursor-pointer items-center gap-3 rounded-md border-2 border-dashed border-slate-300 px-6 py-3 transition hover:border-[#003f87] hover:bg-slate-50'>
                <Camera className='h-5 w-5 text-slate-500' />
                <span className='text-sm font-semibold text-slate-600'>Add photos</span>
                <input
                    type='file'
                    multiple
                    accept='image/*'
                    className='hidden'
                    onChange={handleFileChange}
                />
            </label>

            {files.length > 0 && (
                <div className='flex flex-wrap gap-3'>
                    {files.map((file, index) => (
                        <div
                            key={`${file.name}-${index}`}
                            className='rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700'
                        >
                            {file.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
