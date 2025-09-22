// Banner Agent - Specialized in compositing final banners from images and text
export class BannerAgent {
  constructor() {
    this.name = 'BannerAgent';
  }

  async createBanners({ headlines, images, uploadedImage, size, template, font }) {
    console.log(`[${this.name}] Creating banners with ${headlines.length} headlines and ${images.length} images`);
    
    const banners = [];
    let bannerId = 1;

    // Create banner from uploaded image if provided
    if (uploadedImage) {
      for (const headline of headlines.slice(0, 1)) { // Usually just the selected headline
        const banner = await this.createSingleBanner({
          id: bannerId++,
          headline: headline.text || headline,
          imageUrl: uploadedImage.url || uploadedImage,
          size,
          template,
          font,
          isUploadedImage: true
        });
        
        if (banner) banners.push(banner);
      }
    }

    // Create banners from generated images
    const selectedHeadline = headlines[0] || { text: 'DEFAULT HEADLINE' };
    
    for (const image of images) {
      const banner = await this.createSingleBanner({
        id: bannerId++,
        headline: selectedHeadline.text || selectedHeadline,
        imageUrl: image.url,
        imagePrompt: image.prompt,
        size,
        template,
        font,
        isUploadedImage: false
      });
      
      if (banner) banners.push(banner);
    }

    console.log(`[${this.name}] Created ${banners.length} banners`);
    
    return banners;
  }

  async createSingleBanner({ id, headline, imageUrl, imagePrompt, size, template, font, isUploadedImage }) {
    try {
      // Parse dimensions
      const [width, height] = size.split('x').map(Number);
      
      // For now, return banner metadata - actual canvas composition would be done on frontend
      const banner = {
        id,
        headline,
        imageUrl,
        imagePrompt,
        size: { width, height },
        template,
        isUploadedImage,
        createdAt: new Date().toISOString(),
        
        // Banner composition metadata
        composition: {
          textOverlay: this.getTextOverlayConfig(template, headline, font),
          imageProcessing: this.getImageProcessingConfig(template),
          colorScheme: this.getColorScheme(template)
        }
      };

      console.log(`[${this.name}] Created banner ${id}: ${headline.substring(0, 30)}...`);
      
      return banner;

    } catch (error) {
      console.error(`[${this.name}] Error creating banner ${id}:`, error);
      return null;
    }
  }

  getFontFamily(fontSelection) {
    const fontMap = {
      'roboto': 'Roboto, sans-serif',
      'inter': 'Inter, sans-serif', 
      'montserrat': 'Montserrat, sans-serif',
      'opensans': 'Open Sans, sans-serif'
    };
    
    return fontMap[fontSelection] || fontMap['roboto'];
  }

  getTextOverlayConfig(template, headline, font = 'roboto') {
    const baseConfig = {
      text: headline,
      maxWidth: 0.95, // 95% of banner width for better text fitting
      fontSize: 'auto', // Auto-calculated based on text length
      fontFamily: this.getFontFamily(font),
      fontWeight: 'bold',
      textAlign: 'center',
      wordWrap: true,
      lineHeight: 1.2,
      position: 'bottom',
      heightRatio: 30, // фиксированная высота в px (фронт её игнорирует в пользу 30px, но оставим как контракт)
      letterSpacing: 0.3,
      shadowBlur: 0,
      stroke: { enabled: false },
      backdropBlur: 0
    };

    // Template-specific styling
    const templateStyles = {
      'blue_white': {
        backgroundColor: 'rgba(0, 102, 204, 0.92)',
        color: '#ffffff',
        borderRadius: 8,
        padding: { top: 12, right: 16, bottom: 12, left: 16 },
        shadow: 'rgba(0, 0, 0, 0.35)'
      },
      'red_white': {
        backgroundColor: 'rgba(220, 53, 69, 0.92)',
        color: '#ffffff',
        borderRadius: 8,
        padding: { top: 12, right: 16, bottom: 12, left: 16 },
        shadow: 'rgba(0, 0, 0, 0.35)'
      }
    };

    return {
      ...baseConfig,
      ...templateStyles[template] || templateStyles['blue_white']
    };
  }

  getImageProcessingConfig(template) {
    return {
      brightness: 0.8, // Slightly darken for better text contrast
      contrast: 1.1,
      saturation: 0.9,
      overlay: {
        type: 'gradient',
        opacity: 0.2,
        direction: 'bottom-to-top'
      }
    };
  }

  getColorScheme(template) {
    const schemes = {
      'blue_white': {
        primary: '#0066cc',
        secondary: '#ffffff',
        accent: '#004499',
        text: '#ffffff',
        background: 'rgba(0, 102, 204, 0.1)'
      },
      'red_white': {
        primary: '#dc3545',
        secondary: '#ffffff',
        accent: '#c82333',
        text: '#ffffff',
        background: 'rgba(220, 53, 69, 0.1)'
      }
    };

    return schemes[template] || schemes['blue_white'];
  }

  // Utility method to calculate optimal font size
  calculateFontSize(text, maxWidth, maxHeight) {
    const baseSize = 24;
    const textLength = text.length;
    
    // Rough calculation - would be refined with actual canvas measurements
    let fontSize = Math.max(12, Math.min(baseSize, maxWidth / textLength * 2));
    
    // Ensure text fits in height
    const estimatedLines = Math.ceil(textLength / (maxWidth / fontSize * 2));
    const lineHeight = fontSize * 1.2;
    const totalTextHeight = estimatedLines * lineHeight;
    
    if (totalTextHeight > maxHeight * 0.8) {
      fontSize = (maxHeight * 0.8) / (estimatedLines * 1.2);
    }
    
    return Math.max(10, Math.floor(fontSize));
  }
}