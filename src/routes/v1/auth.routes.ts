import { Elysia, t } from 'elysia';
import { AuthController } from '../../controllers/auth.controller';
import { AuthHandler } from '../../middlewares/auth';
import type { LoginUser } from '../../models/auth.model';
import { z } from 'zod';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .post('/register', AuthController.register, {
    detail: {
      tags: ['Auth'],
      summary: 'Register a new user',
      description: 'Create a new user in the system'
    }
  })
  .post(
    '/login', AuthController.login, {
      detail: {
        tags: ['Auth'],
        summary: 'Login user',
        description: 'Login user in the system'
      }
    }
  )
  .post('/logout', AuthController.logout, {
    detail: {
      tags: ['Auth'],
      summary: 'logout user',
      description: 'logout user in the system'
    }
  })
  .post('/send-verification-email', AuthController.sendVerifyEmail, {
    detail: {
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      summary: 'Send verification email',
      description: 'Send verification email user before login in the system'
    }
  })
  .get(
    '/verify-email',
    async ({ query }) => {
      try {
        if (!query.token) {
          return { message: 'Token is required' };
        }
        const token = query.token

        await AuthController.verifyEmail(token);

        // return new Response(null, {
        //   status: 302,
        //   headers: {
        //     Location: 'http://localhost:5500/public/verify-success.html'
        //   }
        // });
        return { success: true, message: 'Email verified successfully' };
      } catch (err) {
        console.log('Error', err);
        return {
          status: 400,
          body: { message: 'Invalid or expired token' }
        };
      }
    },
    {
      detail: {
        tags: ['Auth'],
        summary: 'verification email',
        description: 'send verification email user before login in the system'
      }
    }
  )
  .put('/update-profile', AuthController.updatePic, {
    detail: {
      tags: ['Auth'],
      summary: 'Update Profile',
      description: 'Update profile user'
    }
  })
  .delete('/delete-profile', AuthController.deleteProfilePic, {
    detail: {
      tags: ['Auth'],
      summary: 'Delete Profile Picture',
      description: 'Delete the user\'s profile picture from Cloudinary and database',
    },
  })
.get('/check-verification', async ({ headers, set }) => {
    const token = headers.authorization?.replace('Bearer ', '');
    console.log('token: ', token)
    if (!token) {
      set.status = 401;
      return { message: 'Authorization token required' };
    }

    try {
      const isVerified = await AuthController.checkVerification(token);
      console.log('isverified: ', isVerified)
      return { verified: isVerified };
    } catch (err) {
      set.status = 400;
      return { message: err || 'Failed to check verification' };
    }
  }, {
    detail: {
      tags: ['Auth'],
      summary: 'Check verification status',
      description: 'Checks if the user\'s email is verified'
    }
  })