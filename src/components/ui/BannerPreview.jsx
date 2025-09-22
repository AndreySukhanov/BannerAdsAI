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

    // Setup text rendering - оригинальный алгоритм (до брендовых шаблонов)
    const textAreaHeight = 30; // Оригинальная высота плашки 30px
    const maxWidth = width - 10; // Отступы по 5px с каждой стороны

    // Оригинальный простой алгоритм подбора размера шрифта
    let fontSize = 18;
    let lines = [];

    while (fontSize > 8) {
      ctx.font = `bold ${fontSize}px ${getFontFamily(font)}`;
      lines = [];
      let currentLine = '';
      const words = headline.split(' ');

      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        if (ctx.measureText(testLine).width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      lines.push(currentLine);

      const lineHeight = fontSize * 1.1;
      const totalTextHeight = lines.length * lineHeight;

      if (totalTextHeight <= textAreaHeight - 8) {
        break;
      }

      fontSize--;
    }

    // Set final text properties
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add text shadow
    ctx.shadowColor = colors.shadow;
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Draw text background - full width at bottom (30px)
    const backgroundHeight = textAreaHeight;
    const backgroundY = height - backgroundHeight;

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = `${colors.background}ee`;
    ctx.fillRect(0, backgroundY, width, backgroundHeight);

    // Draw text lines centered - оригинальный простой алгоритм
    ctx.shadowColor = colors.shadow;
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Center text in the 30px plaque
    const lineHeight = fontSize * 1.1;
    const totalTextHeight = lines.length * lineHeight;
    const startY = backgroundY + (backgroundHeight - totalTextHeight) / 2 + lineHeight / 2;

    lines.forEach((line, index) => {
      const y = startY + (index * lineHeight);
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