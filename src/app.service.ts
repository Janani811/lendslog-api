import { Injectable } from '@nestjs/common';
import { UserRepository } from './database/repositories/User.repository';

@Injectable()
export class AppService {
  constructor(private readonly userRepository: UserRepository) {}
  getUsers() {
    return this.userRepository.getUsers();
  }
}
