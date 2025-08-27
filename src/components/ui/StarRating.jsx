import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ 
  value = 0, 
  onChange, 
  size = 24, 
  readonly = false,
  showValue = true,
  className = "",
  hoverable = true
}) => {
  const [rating, setRating] = useState(value);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    setRating(value);
  }, [value]);

  const handleClick = (starValue) => {
    if (readonly) return;
    
    setRating(starValue);
    if (onChange) {
      onChange(starValue);
    }
  };

  const handleMouseEnter = (starValue) => {
    if (readonly || !hoverable) return;
    setHoverRating(starValue);
  };

  const handleMouseLeave = () => {
    if (readonly || !hoverable) return;
    setHoverRating(0);
  };

  const displayRating = hoverRating || rating;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`
              transition-colors duration-150 
              ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-105'}
              ${!readonly && hoverable ? 'hover:opacity-80' : ''}
            `}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
          >
            <Star
              size={size}
              className={`
                transition-colors duration-150
                ${star <= displayRating 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'fill-gray-200 text-gray-300'
                }
              `}
            />
          </button>
        ))}
      </div>
      
      {showValue && rating > 0 && (
        <span className="text-sm text-gray-600 ml-2">
          {rating} из 5
        </span>
      )}
    </div>
  );
};

export default StarRating;