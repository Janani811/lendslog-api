import { Inject } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DB } from '../database.constants';
import { Database } from '../types/Database';

import { InsertUser, users } from '../schemas/schema';

export class UserRepository {
  constructor(
    @Inject(DB)
    private readonly dbObject: Database,
  ) {}

  getUsers() {
    return this.dbObject.db.query.users.findMany();
  }
  getOne(args: { id?: number; phone?: string }) {
    return this.dbObject.db.query.users.findFirst({
      where: (users, { eq }) => {
        const conditions: any = [];
        if (args && args.id) conditions.push(eq(users.us_id, args.id));
        if (args && args.phone) conditions.push(eq(users.us_phone_no, args.phone));
        return and(conditions);
      },
    });
  }
  async createUser(data: any) {
    return await this.dbObject.db.insert(users).values(data).returning();
  }
  async updateUser(data: InsertUser, phone: string) {
    return await this.dbObject.db
      .update(users)
      .set(data)
      .where(eq(users.us_phone_no, phone))
      .returning();
  }
}
