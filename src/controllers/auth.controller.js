import refreshTokenFcn from '../services/auth.service.js';
import { sendError, sendSuccess } from '../utils/response.js';
import extractBearerToken from '../utils/extractBearerToken.js';

const AuthController = {
    async rfToken(req, res) {
        try {
            const rfToken = extractBearerToken(req.headers.authorization);
            if (!rfToken) return sendError(res, 'Không có refresh token', 401);

            const data = await refreshTokenFcn(rfToken);

            return sendSuccess(res, data, 'Làm mới token thành công', 200);

        } catch (err) {
            return sendError(res, err.message, 401);
        }
    }
};

export default AuthController;