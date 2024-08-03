import { Inject } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';

import { DB } from '../database.constants';
import { Database } from '../types/Database';

import { InsertUser, installmentTimelines, lends, users } from '../schemas/schema';

export class UserRepository {
  constructor(
    @Inject(DB)
    private readonly dbObject: Database,
  ) {}

  getUsers() {
    return this.dbObject.db.query.users.findMany();
  }

  getUserWithLendsCount() {
    return this.dbObject.db
      .select({
        // count: sql`count(${lends.ld_id})`.mapWith(Number),
        us_id: users.us_id,
        pending_installment_count: sql`count(${installmentTimelines.it_id})`.mapWith(Number),
        // ld_id: lends.ld_id,
      })
      .from(users)
      .innerJoin(lends, eq(users.us_id, lends.ld_lender_id))
      .leftJoin(installmentTimelines, eq(lends.ld_id, installmentTimelines.it_lend_id))
      .where(
        and(
          eq(lends.ld_lend_status, 1),
          sql`DATE(it_installment_date) <= CURRENT_DATE and it_installement_status = 1`,
        ),
      )
      .groupBy(users.us_id);
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
  async updateUser(data: InsertUser, args: { us_phone_no?: string; us_id?: number }) {
    return await this.dbObject.db
      .update(users)
      .set(data)
      .where(args.us_id ? eq(users.us_id, args.us_id) : eq(users.us_phone_no, args.us_phone_no))
      .returning();
  }
}
