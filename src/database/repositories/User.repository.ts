import { Inject } from '@nestjs/common';
import { DB } from '../database.constants';
import { Database } from '../types/Database';
import { and } from 'drizzle-orm';
import { users } from '../schemas/schema';

export class UserRepository {
  constructor(
    @Inject(DB)
    private readonly dbObject: Database,
  ) {}

  getUsers() {
    return this.dbObject.db.query.users.findMany();
  }
  getOne(args: { id?: number; email?: string }) {
    return this.dbObject.db.query.users.findFirst({
      where: (users, { eq }) =>  {
        let conditions: any = [];
        if(args && args.id) conditions.push(eq(users.us_id, args.id))
        if(args && args.email) conditions.push(eq(users.us_email, args.email))
        return and(conditions)
      },
    });
  }
  async createUser(data: any) {
    return await this.dbObject.db
      .insert(users)
      .values(data)
      .returning()
  }
}
