// Multi-Agent API endpoints
import { coordinator } from '../agents/coordinator.js';

// Generate complete banner from URL
export async function generateBanner(req, res) {
  try {
    const { url, size, template, font, uploadedImage } = req.body;
    
    console.log('=== Multi-Agent Banner Generation ===');
    console.log('Request:', { url, size, template, font, hasUploadedImage: !!uploadedImage });
    
    if (!url || !size || !template) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['url', 'size', 'template']
      });
    }
    
    const result = await coordinator.generateBanner({
      url,
      size,
      template,
      font,
      uploadedImage
    });
    
    res.json({
      success: true,
      taskId: result.taskId,
      headlines: result.headlines,
      images: result.images,
      banners: result.banners,
      webContent: result.webContent
    });
    
  } catch (error) {
    console.error('Multi-agent banner generation error:', error);
    res.status(500).json({
      error: 'Banner generation failed',
      message: error.message
    });
  }
}

// Generate headlines only
export async function generateHeadlines(req, res) {
  try {
    console.log('=== Multi-Agent Headlines Generation ===');
    console.log('Raw request body:', req.body);
    console.log('Request headers:', req.headers);
    
    const { url, template } = req.body;
    console.log('Parsed request:', { url, template });
    
    if (!url || !template) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['url', 'template']
      });
    }
    
    const result = await coordinator.generateHeadlines({
      url,
      template
    });
    
    res.json({
      success: true,
      taskId: result.taskId,
      headlines: result.headlines,
      webContent: result.webContent
    });
    
  } catch (error) {
    console.error('Multi-agent headlines generation error:', error);
    res.status(500).json({
      error: 'Headlines generation failed',
      message: error.message
    });
  }
}

// Generate banner from selected headline
export async function generateBannerFromHeadline(req, res) {
  try {
    const { selectedHeadline, size, template, font, uploadedImage, webContent, url } = req.body;
    
    console.log('=== Multi-Agent Banner from Headline ===');
    console.log('Request:', { 
      headline: selectedHeadline?.substring(0, 30) + '...',
      size, 
      template,
      font,
      hasUploadedImage: !!uploadedImage,
      hasWebContent: !!webContent
    });
    
    if (!selectedHeadline || !size || !template) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['selectedHeadline', 'size', 'template']
      });
    }
    
    const result = await coordinator.generateBannerFromHeadline({
      selectedHeadline,
      size,
      template,
      font,
      uploadedImage,
      webContent,
      url
    });
    
    res.json({
      success: true,
      taskId: result.taskId,
      banners: result.banners,
      images: result.images
    });
    
  } catch (error) {
    console.error('Multi-agent banner from headline error:', error);
    res.status(500).json({
      error: 'Banner from headline generation failed',
      message: error.message
    });
  }
}

// Get task status
export async function getTaskStatus(req, res) {
  try {
    const { taskId } = req.params;
    
    if (!taskId) {
      return res.status(400).json({
        error: 'Missing taskId parameter'
      });
    }
    
    const task = coordinator.getTaskStatus(parseInt(taskId));
    
    if (!task) {
      return res.status(404).json({
        error: 'Task not found'
      });
    }
    
    res.json({
      success: true,
      task: {
        id: task.id,
        status: task.status,
        startTime: task.startTime,
        endTime: task.endTime,
        duration: task.duration,
        error: task.error?.message
      }
    });
    
  } catch (error) {
    console.error('Get task status error:', error);
    res.status(500).json({
      error: 'Failed to get task status',
      message: error.message
    });
  }
}

// Get coordinator statistics
export async function getStats(req, res) {
  try {
    const stats = coordinator.getStats();
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Failed to get stats',
      message: error.message
    });
  }
}