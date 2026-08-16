import type { Types } from 'mongoose';
import { UserModel, UserRole, type UserDocument } from '../models';
import { DuplicateEmailError, NotFoundError, isMongoDuplicateKeyError } from './errors';

export type CreateUserInput = {
  name: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
  active?: boolean;
};

export type UpdateUserInput = {
  name?: string;
  email?: string;
  passwordHash?: string;
};

export class UserRepository {
  async create(input: CreateUserInput): Promise<UserDocument> {
    try {
      return await UserModel.create({
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role ?? UserRole.User,
        active: input.active ?? true,
      });
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) {
        throw new DuplicateEmailError(input.email);
      }
      throw error;
    }
  }

  async findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return UserModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email: email.trim().toLowerCase() }).exec();
  }

  async list(): Promise<UserDocument[]> {
    return UserModel.find().sort({ createdAt: 1 }).exec();
  }

  async update(id: string | Types.ObjectId, input: UpdateUserInput): Promise<UserDocument> {
    try {
      const user = await UserModel.findByIdAndUpdate(
        id,
        {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.email !== undefined ? { email: input.email } : {}),
          ...(input.passwordHash !== undefined ? { passwordHash: input.passwordHash } : {}),
        },
        { new: true, runValidators: true },
      ).exec();

      if (!user) {
        throw new NotFoundError('User', String(id));
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      if (isMongoDuplicateKeyError(error) && input.email) {
        throw new DuplicateEmailError(input.email);
      }
      throw error;
    }
  }

  async setRole(id: string | Types.ObjectId, role: UserRole): Promise<UserDocument> {
    const user = await UserModel.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true },
    ).exec();

    if (!user) {
      throw new NotFoundError('User', String(id));
    }
    return user;
  }

  async setActive(id: string | Types.ObjectId, active: boolean): Promise<UserDocument> {
    const user = await UserModel.findByIdAndUpdate(
      id,
      { active },
      { new: true, runValidators: true },
    ).exec();

    if (!user) {
      throw new NotFoundError('User', String(id));
    }
    return user;
  }
}
