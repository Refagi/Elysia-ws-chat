import { Elysia, t } from 'elysia';
import { UserController } from '../../controllers/user.controller';

export const userRoutes = new Elysia({prefix: '/users'})
.get('/', UserController.getUsersSideBar, {
  detail: {
    tags: ['Users'],
    summary: 'Get users sidebar',
    description: 'Fetches all users except the logged-in user for the chat sidebar'
}
})
.get('/current-user', UserController.getUserById, {
  detail: {
    tags: ['User'],
    summary: 'Get user By Id',
    description: 'Fetches user except the logged-in user'
  }
})
.get("/getUsers", UserController.searchUser, {
   detail: {
    tags: ['User'],
    summary: 'Search user',
    description: 'Fetches user except the logged-in in search bar'
  }
})
