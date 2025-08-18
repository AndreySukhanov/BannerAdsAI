// Custom backend API functions
import { 
  InvokeLLM as APIInvokeLLM,
  GenerateImage as APIGenerateImage,
  UploadFile as APIUploadFile
} from './client.js';

// Export functions with a consistent interface
export const InvokeLLM = APIInvokeLLM;
export const GenerateImage = APIGenerateImage;
export const UploadFile = APIUploadFile;

// Placeholder for future functions
export const SendEmail = async () => {
  throw new Error('SendEmail not implemented in custom backend');
};

export const ExtractDataFromUploadedFile = async () => {
  throw new Error('ExtractDataFromUploadedFile not implemented in custom backend');
};

export const Core = {
  InvokeLLM,
  GenerateImage,
  UploadFile,
  SendEmail,
  ExtractDataFromUploadedFile
};






