export const signup = async (req, res) => {
const { fullName, email, password } = req.body;

try {
// 1. VALIDASI INPUT
if (!fullName?.trim() || !email?.trim() || !password?.trim()) {
return res.status(400).json({
message: "All fields are required",
field: !fullName ? "fullName" : !email ? "email" : "password"
});
}

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format"
      });
    }

    // Validasi strength password
    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters"
      });
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return res.status(400).json({
        message: "Password must contain uppercase, lowercase and numbers"
      });
    }

    // 2. CEK DUPLIKASI USER
    const existingUser = await User.findOne({
      email: email.toLowerCase()
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    // 3. HASH PASSWORD
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. BUAT USER
    const newUser = new User({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    // 5. SIMPAN USER TERLEBIH DAHULU
    await newUser.save();

    // 6. GENERATE TOKENS SETELAH USER DISIMPAN
    const { accessToken, refreshToken } = generateTokens(newUser._id);

    // 7. SIMPAN REFRESH TOKEN
    await storeRefreshToken(newUser._id, refreshToken);

    // 8. SET COOKIES
    setCookies(res, accessToken, refreshToken);

    // 9. RESPONSE
    res.status(201).json({
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      profilePic: newUser.profilePic,
      role: newUser.role,
    });

} catch (error) {
console.error("Error in signup controller:", error);

    // Handle specific errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Invalid input data"
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email already exists"
      });
    }

    res.status(500).json({
      message: "Internal server error"
    });

}
};
