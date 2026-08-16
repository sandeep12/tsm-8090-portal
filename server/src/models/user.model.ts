import { Schema, model, type HydratedDocument, type InferSchemaType, type Types } from 'mongoose';

export const UserRole = {
  Administrator: 'Administrator',
  User: 'User',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.User,
    },
    active: { type: Boolean, required: true, default: true },
  },
  {
    timestamps: true,
    collection: 'users',
  },
);

userSchema.index({ email: 1 }, { unique: true });

export type User = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };
export type UserDocument = HydratedDocument<User>;

export const UserModel = model('User', userSchema);
