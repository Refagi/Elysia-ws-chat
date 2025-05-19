// const objectId = (value: string, helpers) => {
//   if (!value.match(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi)) {
//     return helpers.message('"{{#label}}" must be a valid UUID');
//   }
//   return value;
// };

interface Helpers {
  message: (msg: string) => {};
}

export const password = (value: string, helpers: Helpers) => {
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/) || !value.match(/[!@#$%^&*(),.?":{}|<>]/)) {
    return helpers.message('password must contain at least 1 letter, 1 number and 1 special characters');
  }
  return value;
};