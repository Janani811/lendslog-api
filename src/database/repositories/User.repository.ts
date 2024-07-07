import { Inject } from '@nestjs/common';
import { DB } from '../database.constants';
import { Database } from '../types/Database';

export class UserRepository {
  constructor(
    @Inject(DB)
    private readonly dbObject: Database,
  ) {}

  getUsers() {
    return this.dbObject.db.query.user.findMany();
  }
}
