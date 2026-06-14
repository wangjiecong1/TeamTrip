export type UploadBizType = "user_avatar" | "team_cover" | "archetype_avatar" | "itinerary_photo";

export type UploadFileResponse = {
  fileId: number;
  fileKey: string;
  originalName: string;
  accessUrl: string;
  fileSize: number;
  mimeType: string;
};
