import React from 'react';
import { Button } from '@/components/ui/button';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, imageUrl, alt = "Image" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative max-w-4xl max-h-[90vh] w-full">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-3"
        >
          <i className="fas fa-times text-xl"></i>
        </Button>

        {/* Image Container */}
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={imageUrl}
            alt={alt}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            style={{ maxHeight: '80vh' }}
          />
        </div>

        {/* Image Info */}
        <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center justify-between text-white text-sm">
            <span className="flex items-center space-x-2">
              <i className="fas fa-image"></i>
              <span>Click outside or press ESC to close</span>
            </span>
            <span className="text-slate-300">
              {alt}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
