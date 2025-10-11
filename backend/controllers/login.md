export const login = async (req, res) => {
const { email, password } = req.body;

try {
// Validasi input
if (!email?.trim() || !password?.trim()) {
return res.status(400).json({
message: "Email and password are required"
});
}

    // Cari user + select password explicitly
    const user = await User.findOne({
      email: email.toLowerCase()
    }).select('+password');

    // Authentication
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);

    // Set cookies
    setCookies(res, accessToken, refreshToken);

    // Response
    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      role: user.role,
    });

} catch (error) {
console.error("Error in login controller:", error);
res.status(500).json({
message: "Internal server error"
});
}
};
