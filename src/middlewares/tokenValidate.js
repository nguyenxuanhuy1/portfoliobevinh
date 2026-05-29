import { verifyAccessToken } from "../utils/jwt.js";
import { sendError } from "../utils/response.js";
import extractBearerToken from "../utils/extractBearerToken.js";

const tokenValidate = (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return sendError(res, "Không có token", 401);
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();

  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return sendError(res, "Token đã hết hạn", 401);
    }
    return sendError(res, "Token không hợp lệ", 401);
  }
};

export default tokenValidate;