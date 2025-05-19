import { z } from 'zod';

export const getUserSideBar = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi, {
    message: '"id" must be a valid UUID'
  })
});

export const searchUser = z.object({
  username: z.string().min(1, 'Username must be at least 1 character long'),
});