import { z } from 'zod';

export const objectId = z.string().regex(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi, {
    message: '"id" must be a valid UUID'});

export const getMessages = z.object({
  receiverId: objectId
});

export const deleteMessage = z.object({
  messageId: objectId,
  senderId: objectId
})

export const sendMessage = z.object({
  receiverId: objectId,
  text: z.string().optional(),
  image: z
  .string()
  .optional()
  .refine(
    (value) => {
      if (!value) return true;
      const base64Regex = /^data:image\/(jpeg|png|jpg|webp|gif)+;base64,/;
      if (!base64Regex.test(value)) return false;

      // Periksa ukuran (perkiraan)
      const base64Data = value.split(",")[1];
      const sizeInBytes = (base64Data.length * 3) / 4 - 2; // Perkiraan ukuran dalam bytes
      const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
      return sizeInBytes <= maxSizeInBytes;
    },
    {
      message: "Image must be a valid base64 string and less than 5MB",
    }
  ),
})