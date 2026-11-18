import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email: email.trim().toLowerCase() } });
  }

  findById(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(email: string, passwordHash: string, name = '') {
    return this.repo.save(this.repo.create({ email: email.trim().toLowerCase(), passwordHash, name }));
  }
}
