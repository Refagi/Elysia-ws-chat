import { UserService } from './user.service';
import { TokenService } from './token.service';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { MessageService } from './message.service'

const userService = new UserService();
const tokenService = new TokenService();
const authService = new AuthService();
const emailService = new EmailService();
const messageService = new MessageService();

export default {
  UserService,
  TokenService,
  AuthService,
  EmailService,
  messageService
}