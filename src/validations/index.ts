import { register, login, logout, verifyEmail } from './auth.validation'
import { getMessages, sendMessage, deleteMessage } from './messsage.validation'
import { getUserSideBar, searchUser } from './user.validation'

export default {
  register,
  login,
  logout,
  verifyEmail,
  getMessages,
  sendMessage,
  getUserSideBar, 
  deleteMessage,
  searchUser
}