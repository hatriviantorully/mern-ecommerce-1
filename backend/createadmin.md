# Copy dan paste ini saja di PowerShell:

$body = @{
name = "Super Admin"
email = "admin@test.com"
password = "admin123"
} | ConvertTo-Json

Write-Host "Sending request..."
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/create-admin" -Method Post -Body $body -ContentType "application/json"
Write-Host "Request completed!"

# Untuk platform seperti Heroku, Vercel, Railway, dll

CREATE_FIRST_ADMIN=true
FIRST_ADMIN_EMAIL=admin@yourapp.com
FIRST_ADMIN_PASSWORD=ChangeThisPassword123!
ADMIN_INVITATION_CODE=SUPER_SECRET_CODE_2024

import User from "./models/user.model.js";

const createFirstAdmin = async () => {
if (process.env.CREATE_FIRST_ADMIN === 'true') {
try {
const existingAdmin = await User.findOne({ role: 'admin' });
if (!existingAdmin) {
const adminUser = new User({
name: process.env.FIRST_ADMIN_NAME,
email: process.env.FIRST_ADMIN_EMAIL,
password: process.env.FIRST_ADMIN_PASSWORD,
role: 'admin'
});
await adminUser.save();
console.log('✅ First admin user created automatically');
}
} catch (error) {
console.log('⚠️ Auto admin creation skipped:', error.message);
}
}
};

// Panggil setelah koneksi database
connectDB().then(() => {
createFirstAdmin();
});
