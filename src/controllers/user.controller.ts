import services from '../services/index';
import type { CreateUser } from '../models/user.model';
import { ApiError } from '../utils/ApiError';
import httpStatus from 'http-status';
import { AuthService } from '../services/auth.service';
import { AuthHandler } from '../middlewares/auth';
import { CatchAllError } from '../utils/catchError';
import validations from '../validations';

const authHandler = new AuthHandler();
@CatchAllError
export class UserController {
  static async createUser({ body }: { body: CreateUser; set: number }) {
    const users = await services.UserService.createUser(body.username, body.email, body.password);
    return users;
  }

  static async getUsersSideBar({ request }: { request: Request }) {
    const auth = await authHandler.authenticate(request);
    const id = auth.id;
    const valid = validations.getUserSideBar.parse({ id });
    const getUsers = await services.UserService.getUsersSideBar(valid.id);
    if (!getUsers) return null;
    return { status: httpStatus.OK, message: 'Get Users is sucessfully', users: getUsers };
  }

  static async getUserById({ request }: { request: Request }) {
    const auth = await authHandler.authenticate(request);
    const getUser = await services.UserService.getUserById(auth.id);
    if (!getUser) throw new ApiError(httpStatus.NOT_FOUND, 'User is not found');
    return { status: httpStatus.OK, message: 'Get User is sucessfully', user: getUser };
  }

  static async searchUser({ query }: { query: { username: string } }) {
    const username = query.username;
    const valid = validations.searchUser.parse({ username });
    const users = await services.UserService.searchUser(valid.username);
    return { status: httpStatus.OK, message: users.length > 0 ? 'Get Users successfully' : 'No users found', users};
  }
}
