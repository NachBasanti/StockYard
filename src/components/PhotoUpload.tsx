import { useState } from 'react';

interface PhotoUploadProps {
  name: string;
  label: string;
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  initialPhotos?: string[];
}

export const PhotoUpload = ({ 
  name, 
  label, 
  onChange, 
  maxPhotos = 4,
  initialPhotos = []
}: PhotoUploadProps) => {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (files.length > maxPhotos) {
      setError(`You can only upload ${maxPhotos} photos`);
      return;
    }

    setError(null);
    const fileArray = Array.from(files);
    const photoURLs = fileArray.map(file => URL.createObjectURL(file));
    setPhotos(photoURLs);
    onChange(photoURLs);
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = [...photos];
    updatedPhotos.splice(index, 1);
    setPhotos(updatedPhotos);
    onChange(updatedPhotos);
  };

  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2">
        {label}
      </label>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id={name}
      />
      <label
        htmlFor={name}
        className="block w-full p-2 border border-gray-300 rounded cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-150"
      >
        {photos.length === 0 
          ? `Choose up to ${maxPhotos} photos` 
          : `${photos.length} photo(s) selected`}
      </label>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      
      {photos.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative">
              <img
                src={photo}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};