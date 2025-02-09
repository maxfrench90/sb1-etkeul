export interface ProviderFormData {
  name: string;
  email: string;
  phone: string;
  services: string[];
  experience: string;
  about: string;
  policeCheck?: File;
}

export interface FileUploadState {
  file: File | null;
  error: string | null;
  uploading: boolean;
}