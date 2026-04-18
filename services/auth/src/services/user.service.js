import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { config } from '../config.js';
import { conflict, unauthorized, notFound } from '../lib/errors.js';

export async function createUser(input) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw conflict('Email already registered');

  const passwordHash = await bcrypt.hash(input.password, config.bcryptRounds);
  return prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
      role: input.role,
      cityZone: input.cityZone,
      category: input.category,
    },
  });
}

export async function authenticate(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw unauthorized('Invalid credentials');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw unauthorized('Invalid credentials');

  return user;
}

export async function getActiveUser(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || !user.isActive) throw unauthorized('User no longer active');
  return user;
}

export async function getUserProfile(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw notFound('User not found');
  return user;
}

export function toPublicProfile(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    city_zone: user.cityZone,
    category: user.category,
  };
}
