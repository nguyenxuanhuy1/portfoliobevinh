const extractBearerToken = (authHeader) => {
    if (!authHeader) return null;
    return authHeader.startsWith('Bearer ') 
        ? authHeader.split(' ')[1] 
        : authHeader;
};
export default extractBearerToken