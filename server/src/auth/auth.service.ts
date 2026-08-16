import { UserRepository } from '../repositories';
import { UnauthorizedError, ForbiddenError } from '../errors/http-errors';
import type { UserDocument } from '../models';
import { verifyPassword } from './password';

const INVALID_CREDENTIALS_MESSAGE = 'Email or password is incorrect';

export class AuthService {
  constructor(private readonly users: UserRepository = new UserRepository()) {}

  /**
   * Validate credentials and return the active user document.
   * Bad credentials always use the same non-revealing message.
   */
  async authenticate(email: string, password: string): Promise<UserDocument> {
    const user = await this.users.findByEmail(email);

    if (!user) {
      throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
    }

    const matches = await verifyPassword(password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
    }

    if (!user.active) {
      throw new ForbiddenError('The account is not active');
    }

    return user;
  }
}
