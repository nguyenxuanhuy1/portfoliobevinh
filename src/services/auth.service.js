import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
} from '../utils/jwt.js';

const refreshTokenFcn = async (rfToken) => {
    try {
        const decoded = verifyRefreshToken(rfToken);

        const now = Math.floor(Date.now() / 1000);

        if (decoded.exp < now) {
            throw new Error("Token hết hạn");
        }

        const payload = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };

        const accessToken = generateAccessToken(payload);

        const newRefreshToken = generateRefreshToken(payload);

        return {
            accessToken,
            refreshToken: newRefreshToken
        };
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Refresh token hết hạn');
        }

        throw new Error('Refresh token không hợp lệ');
    }
};

export default refreshTokenFcn;