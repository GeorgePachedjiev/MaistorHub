const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Master = require('../models/Master');

// Валидация на email формат
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Валидация на телефонен номер (български формат)
const isValidPhone = (phone) => {
  const phoneRegex = /^(\+359|0)[0-9]{9}$/;
  return phoneRegex.test(phone);
};

const register = async (req, res) => {
  try {
    const { name, email, phone, password, services, price_range, city } = req.body;

    // Валидация на задължителни полета
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Име, email и парола са задължителни полета'
      });
    }

    // Валидация на email формат
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Невалиден email формат'
      });
    }

    // Валидация на парола (минимум 6 символа)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Паролата трябва да бъде поне 6 символа'
      });
    }

    // Валидация на телефон, ако е предоставен
    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Невалиден телефонен номер. Използвайте български формат (0888123456 или +359888123456)'
      });
    }

    // Проверка дали email вече съществува
    const existingMaster = await Master.findByEmail(email);
    if (existingMaster) {
      return res.status(409).json({
        success: false,
        error: 'Майстор с този email вече съществува'
      });
    }

    // Хеширане на паролата
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Създаване на майстор
    const newMaster = await Master.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      password: hashedPassword,
      services: services ? services.trim() : null,
      price_range: price_range ? price_range.trim() : null,
      city: city ? city.trim() : null
    });

    // Връщане на успешен отговор (без парола)
    res.status(201).json({
      success: true,
      message: 'Майсторът е регистриран успешно',
      data: {
        id: newMaster.id,
        name: newMaster.name,
        email: newMaster.email,
        phone: newMaster.phone,
        services: newMaster.services,
        price_range: newMaster.price_range,
        city: newMaster.city
      }
    });

  } catch (error) {
    console.error('Register error:', error);

    // Обработка на MySQL грешки
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'Майстор с този email вече съществува'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Възникна грешка при регистрацията'
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Валидация на задължителни полета
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email и парола са задължителни полета'
      });
    }

    // Намиране на майстор по email
    const master = await Master.findByEmail(email.toLowerCase().trim());
    if (!master) {
      return res.status(401).json({
        success: false,
        error: 'Невалиден email или парола'
      });
    }

    // Проверка на паролата
    const isPasswordValid = await bcrypt.compare(password, master.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Невалиден email или парола'
      });
    }

    // Генериране на JWT token
    const token = jwt.sign(
      { 
        id: master.id, 
        email: master.email 
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    // Връщане на успешен отговор с token
    res.json({
      success: true,
      message: 'Успешен вход',
      token: token,
      data: {
        id: master.id,
        name: master.name,
        email: master.email,
        phone: master.phone,
        services: master.services,
        price_range: master.price_range,
        city: master.city
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Възникна грешка при влизането'
    });
  }
};

module.exports = {
  register,
  login
};
