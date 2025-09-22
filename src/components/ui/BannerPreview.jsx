import { useEffect, useRef } from 'react';

export default function BannerPreview({
  headline,
  font = 'roboto',
  template = 'blue_white',
  size = '300x250',
  className = '',
  variant = 1,
  brandingData = null
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

  // Render branded template preview
  const renderBrandedPreview = (ctx, width, height, headline, variant, brandingData) => {
    // Create gradient background (simulating background image)
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#2D5A87');
    gradient.addColorStop(1, '#1A3B5C');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle pattern to simulate image
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < width; i += 15) {
      for (let j = 0; j < height; j += 15) {
        if ((i + j) % 30 === 0) {
          ctx.fillRect(i, j, 8, 8);
        }
      }
    }

    // Brand header removed

    // Render text based on variant
    if (variant === 1) {
      // Variant 1: Red background under each line
      renderVariant1Text(ctx, width, height, headline);
    } else if (variant === 2) {
      // Variant 2: White panel at bottom
      renderVariant2Text(ctx, width, height, headline);
    } else if (variant === 3) {
      // Variant 3: Text directly on image with embossed effect
      renderVariant3Text(ctx, width, height, headline);
    }
  };

  const renderVariant1Text = (ctx, width, height, headline) => {
    const words = headline.split(' ');
    const lines = [];
    let currentLine = '';
    const maxWidth = width * 0.8;

    ctx.font = 'bold 16px Arial';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    const lineHeight = 25;
    const totalTextHeight = lines.length * lineHeight;
    const bottomMargin = 20;
    const startY = height - bottomMargin - totalTextHeight + lineHeight;

    lines.forEach((line, index) => {
      const y = startY + (index * lineHeight);
      const lineWidth = ctx.measureText(line).width;

      // Red background
      ctx.fillStyle = '#DD0000';
      ctx.fillRect(10, y - 12, lineWidth + 10, 20);

      // White text
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.fillText(line, 15, y);
    });
  };

  const renderVariant2Text = (ctx, width, height, headline) => {
    // White panel at bottom
    const panelHeight = 80;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, height - panelHeight, width, panelHeight);

    // Red kicker
    ctx.fillStyle = '#DD0000';
    ctx.fillRect(10, height - panelHeight + 10, 80, 18);
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText('Получите свою', 15, height - panelHeight + 21);

    // Main text
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#000000';
    const words = headline.toLowerCase().split(' ');
    let y = height - panelHeight + 45;
    let line = '';

    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      if (ctx.measureText(testLine).width > width - 20) {
        ctx.fillText(line, 10, y);
        line = word;
        y += 16;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 10, y);
  };

  const renderVariant3Text = (ctx, width, height, headline) => {
    // Center-aligned text in bottom area with red kicker
    const words = headline.split(' ');
    const lines = [];
    let currentLine = '';
    const maxWidth = width * 0.8;

    ctx.font = 'bold 16px Arial';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    const lineHeight = 20;
    const totalTextHeight = lines.length * lineHeight;
    const bottomMargin = 20;
    const startY = height - bottomMargin - totalTextHeight + lineHeight;

    lines.forEach((line, index) => {
      const y = startY + (index * lineHeight);

      if (index === 0) {
        // First line with red background (kicker)
        const lineWidth = ctx.measureText(line).width;
        const bgPadding = 8;

        // Red background
        ctx.fillStyle = '#DD0000';
        ctx.fillRect(width / 2 - lineWidth / 2 - bgPadding, y - 14, lineWidth + bgPadding * 2, 18);

        // White text on red background
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(line, width / 2, y);
      } else {
        // Other lines with embossed effect on image
        // Double shadow for stronger embossed effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.textAlign = 'center';
        ctx.fillText(line, width / 2 + 2, y + 2);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillText(line, width / 2 + 1, y + 1);

        // Main text with white color
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(line, width / 2, y);
      }
    });
  };

  useEffect(() => {
    if (!headline || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const [width, height] = size.split('x').map(Number);

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Handle branded template differently
    if (template === 'branded') {
      renderBrandedPreview(ctx, width, height, headline, variant, brandingData);
      return;
    }

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
    const textPadding = 6; // Minimal padding from edges for better text space
    const maxWidth = width - (textPadding * 2); // Full width minus minimal padding
    const textAreaHeight = 30; // Fixed height for text area (same as backend)
    
    // Calculate font size based on text length and available space
    // Improved formula for better text fitting with long headlines
    let fontSize = Math.min(24, Math.max(10, Math.sqrt(maxWidth * 20 / headline.length)));
    
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

    // Simple word wrapping without hyphenation
    const words = headline.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
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
          newLines.push(newCurrentLine);
          newCurrentLine = word;
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

    // Calculate center of the plaque for text positioning
    const plaqueCenterY = backgroundY + backgroundHeight / 2;
    const totalTextHeight = lines.length * lineHeight;
    const startY = plaqueCenterY - totalTextHeight / 2 + lineHeight / 2;

    lines.forEach((line, index) => {
      const y = startY + index * lineHeight;
      ctx.fillText(line, width / 2, y);
    });

  }, [headline, font, template, size, variant, brandingData]);

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