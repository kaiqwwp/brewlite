import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { isUniqueViolation } from '../common/db-errors';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto';

export const publicUser = (u: User) => ({
  id: u.id, email: u.email, name: u.name, role: u.role, loyaltyPoints: u.loyaltyPoints,
});

@Injectable()
export class AuthService {
  constructor(private readonly users: UsersService, private readonly jwt: JwtService) {}

  async register(dto: RegisterDto) {
    if (await this.users.findByEmail(dto.email)) throw new ConflictException('Email đã được đăng ký');
    const hash = await bcrypt.hash(dto.password, 10); // băm mật khẩu bằng bcrypt
    try {
      return this.issue(await this.users.create(dto.email, hash, dto.name));
    } catch (e) {
      if (isUniqueViolation(e)) throw new ConflictException('Email đã được đăng ký');
      throw e;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    const ok = user && (await bcrypt.compare(dto.password, user.passwordHash));
    if (!user || !ok) throw new UnauthorizedException('Sai email hoặc mật khẩu');
    return this.issue(user);
  }

  private issue(user: User) {
    const accessToken = this.jwt.sign({ sub: user.id, email: user.email, role: user.role });
    return { accessToken, user: publicUser(user) };
  }
}
