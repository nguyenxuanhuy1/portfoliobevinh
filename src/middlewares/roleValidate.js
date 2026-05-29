import { sendError } from '../utils/response.js';

const roleValidate = (req, res, next) => {
  try {
    const role = req.user.role;
    if (role === 'ADMIN') return next();
    return sendError(res, 'Bạn đéo phải vua', 403);
  } catch (error) {
    return sendError(res, 'Bạn đéo phải vua', 403);
  }
};

export default roleValidate;