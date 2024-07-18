import { Inject } from '@nestjs/common';

import { DB } from '../database.constants';
import { Database } from '../types/Database';
import { lends } from '../schemas/schema';
import { eq } from 'drizzle-orm';

export class LendsRepository {
  constructor(
    @Inject(DB)
    private readonly dbObject: Database,
  ) {}

  // get all lends based on ld_lender_id
  async getAll(args: { ld_lender_id: number }) {
    return this.dbObject.db.query.lends.findMany({
      where: eq(lends.ld_lender_id, args.ld_lender_id),
    });
  }

  // create lend
  async addLend(data: any) {
    return await this.dbObject.db.insert(lends).values(data).returning();
  }
}
