import { useEffect, useRef } from 'react';

export default function BannerPreview({ 
  headline, 
  font = 'roboto', 
  template = 'blue_white', 
  size = '300x250',
  className = '' 
}) {
  const canvasRef = useRef(null);

  // Font mapping (same as in backend)
  const getFontFamily = (fontSelection) => {
    const fontMap = {
      'roboto': 'Roboto, sans-serif',
      'inter': 'Inter, sans-serif', 
      'montserrat': 'Montserrat, sans-serif',
      'opensans': 'Open Sans, sans-serif'
    };
    return fontMap[fontSelection] || fontMap['roboto'];
  };

  // Template colors (same as in backend)
  const getTemplateColors = (template) => {
    const schemes = {
      'blue_white': {
        background: '#0066cc',
        text: '#ffffff',
        shadow: 'rgba(0, 0, 0, 0.35)'
      },
      'red_white': {
        background: '#dc3545',
        text: '#ffffff', 
        shadow: 'rgba(0, 0, 0, 0.35)'
      }
    };
    return schemes[template] || schemes['blue_white'];
  };

  useEffect(() => {
    if (!headline || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const [width, height] = size.split('x').map(Number);
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Get template colors
    const colors = getTemplateColors(template);
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, colors.background);
    gradient.addColorStop(1, `${colors.background}dd`);
    
    // Fill background
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add subtle pattern overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < width; i += 20) {
      for (let j = 0; j < height; j += 20) {
        if ((i + j) % 40 === 0) {
          ctx.fillRect(i, j, 10, 10);
        }
      }
    }

    // Setup text rendering
    const textPadding = 8; // Very small padding from edges
    const maxWidth = width - (textPadding * 2); // Full width minus minimal padding
    const textAreaHeight = 30; // Fixed height for text area (same as backend)
    
    // Calculate font size based on text length and available space
    let fontSize = Math.min(24, Math.max(12, maxWidth / headline.length * 1.8));
    
    // Set font
    ctx.font = `bold ${fontSize}px ${getFontFamily(font)}`;
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'left'; // Align left for better text distribution
    ctx.textBaseline = 'middle';
    
    // Add text shadow
    ctx.shadowColor = colors.shadow;
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Advanced word wrapping with hyphenation
    const hyphenateWord = (word) => {
      // Simple Russian/English hyphenation rules
      if (word.length < 6) return [word]; // Don't hyphenate short words
      
      // Common hyphenation patterns for Russian
      const patterns = [
        /^(.{3,})([аеиоуыэюя].{2,})$/i, // vowel + 2+ chars
        /^(.{4,})(ние|тие|сие)$/i,     // common endings
        /^(.{3,})(ство|тель)$/i,       // common endings
        /^(.{3,})(ция|сия)$/i,         // -ция, -сия
      ];
      
      for (const pattern of patterns) {
        const match = word.match(pattern);
        if (match) {
          return [match[1] + '-', match[2]];
        }
      }
      
      // Fallback: split longer words in middle
      if (word.length > 8) {
        const mid = Math.floor(word.length / 2);
        return [word.slice(0, mid) + '-', word.slice(mid)];
      }
      
      return [word];
    };

    // Smart word wrapping with hyphenation
    const words = headline.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        // Try to hyphenate the word if it's too long
        const hyphenated = hyphenateWord(word);
        
        if (hyphenated.length > 1) {
          // Try fitting the first part with hyphen
          const testWithHyphen = currentLine + (currentLine ? ' ' : '') + hyphenated[0];
          const hyphenMetrics = ctx.measureText(testWithHyphen);
          
          if (hyphenMetrics.width <= maxWidth) {
            lines.push(testWithHyphen);
            currentLine = hyphenated[1];
          } else {
            // Even with hyphenation doesn't fit, break line
            lines.push(currentLine);
            currentLine = word;
          }
        } else {
          // Word can't be hyphenated, break line
          lines.push(currentLine);
          currentLine = word;
        }
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    // Adjust font size to fit in fixed height plaque (30px)
    const maxLines = Math.floor(textAreaHeight / (fontSize * 1.2));
    
    // If text doesn't fit, reduce font size and re-wrap
    if (lines.length > maxLines) {
      // Calculate maximum font size that fits
      const maxFontSize = Math.floor((textAreaHeight - 4) / (lines.length * 1.2)); // 4px for padding
      fontSize = Math.max(8, Math.min(fontSize, maxFontSize));
      ctx.font = `bold ${fontSize}px ${getFontFamily(font)}`;
      
      // Re-wrap text with new font size
      const newMaxWidth = width - (textPadding * 2);
      const newLines = [];
      let newCurrentLine = '';
      
      for (const word of words) {
        const testLine = newCurrentLine + (newCurrentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > newMaxWidth && newCurrentLine) {
          const hyphenated = hyphenateWord(word);
          
          if (hyphenated.length > 1) {
            const testWithHyphen = newCurrentLine + (newCurrentLine ? ' ' : '') + hyphenated[0];
            const hyphenMetrics = ctx.measureText(testWithHyphen);
            
            if (hyphenMetrics.width <= newMaxWidth) {
              newLines.push(testWithHyphen);
              newCurrentLine = hyphenated[1];
            } else {
              newLines.push(newCurrentLine);
              newCurrentLine = word;
            }
          } else {
            newLines.push(newCurrentLine);
            newCurrentLine = word;
          }
        } else {
          newCurrentLine = testLine;
        }
      }
      if (newCurrentLine) newLines.push(newCurrentLine);
      
      // Update lines with new wrapping
      lines.splice(0, lines.length, ...newLines);
    }

    // Draw text background - full width at bottom
    const lineHeight = fontSize * 1.2;
    const totalTextHeight = lines.length * lineHeight;
    // Fixed height exactly 30px as in backend
    const backgroundHeight = textAreaHeight;
    const backgroundY = height - backgroundHeight;
    const textY = height - backgroundHeight / 2;
    
    // Background with full width at bottom
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = `${colors.background}ee`;
    ctx.beginPath();
    ctx.rect(0, backgroundY, width, backgroundHeight);
    ctx.fill();

    // Draw text lines centered with proper text wrapping
    ctx.shadowColor = colors.shadow;
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'center';
    
    lines.forEach((line, index) => {
      const y = textY - (lines.length - 1) * lineHeight / 2 + index * lineHeight;
      ctx.fillText(line, width / 2, y);
    });

  }, [headline, font, template, size]);

  if (!headline) return null;

  const [width, height] = size.split('x').map(Number);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="border border-gray-200 rounded-lg shadow-lg"
        style={{
          maxWidth: '100%',
          height: 'auto',
          aspectRatio: `${width}/${height}`
        }}
      />
      <div className="absolute top-2 right-2 px-2 py-1 bg-white/80 rounded text-xs font-medium text-gray-600">
        {size}
      </div>
    </div>
  );
}