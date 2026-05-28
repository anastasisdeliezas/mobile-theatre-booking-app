import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Λείπει ή δεν είναι έγκυρο το token' });
  }

  const token = header.slice(7).trim();

  if (!token) {
    return res.status(401).json({ message: 'Λείπει ή δεν είναι έγκυρο το token' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Το token έληξε ή δεν είναι έγκυρο' });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Δεν επιτρέπεται η πρόσβαση' });
    }
    next();
  };
}