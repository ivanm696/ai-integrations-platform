import bcrypt from 'bcryptjs';
const hashedPassword = bcrypt.hashSync(password, 10);