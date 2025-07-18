"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { fullName, email, phone, countryCode, countryName, password, confirmPassword } = req.body;
    if (!fullName || !email || !phone || !countryCode || !countryName || !password || !confirmPassword) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match.' });
    }
    const existingEmail = yield prisma.registered.findUnique({ where: { email } });
    if (existingEmail) {
        return res.status(400).json({ error: 'Email already registered.' });
    }
    const existingPhone = yield prisma.registered.findUnique({ where: { phone } });
    if (existingPhone) {
        return res.status(400).json({ error: 'Phone already registered.' });
    }
    const passwordHash = yield bcryptjs_1.default.hash(password, 10);
    yield prisma.registered.create({
        data: {
            fullName,
            email,
            phone,
            countryCode,
            countryName,
            passwordHash,
        },
    });
    return res.status(201).json({ message: 'Registration successful. Please login.' });
}));
exports.default = router;
