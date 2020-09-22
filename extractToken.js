module.exports = (authorization) => {
    try {
        if(String(authorization).slice(0, 6) !== "Bearer")
            return null
        else
            return String(authorization).slice(7)
    } catch (err) {
        return null
    }
}